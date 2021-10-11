var _ = require('lodash');
var each = require('async/each');
var events = require('events');
var express = require('express');
var fs = require('fs');
var morgan = require('morgan');
var drs_utils = require('drs_utils');
var parallel = require('async/parallel');

var logger = drs_utils.get_logger();

var obj_handler = require('object-handler');

// This event emitter is instrumental in providing us a way of knowing when all
// of our handlers are ready.
var eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(0);

// Calls the various handlers' initialization methods.
function initialize(working_path) {
    // These initializations happen asynchronously, so we use events to
    // to track their completion.
    obj_handler.init(eventEmitter, working_path);

    fs.watchFile(drs_utils.get_config(), function(curr, prev) {
        if (curr.mtime.getTime() !== prev.mtime.getTime()) {
            logger.info('Detected that the configuration has been updated.');
            obj_handler.update();
        }
    });
}

// This is the function that launches the app when all
// initialization is complete.
function launch(config) {
    let app = express();

    // Check if SSL/TLS should be enabled or not.
    let https_enabled = config.value('global', 'https_enabled');

    if ((! _.isNil(https_enabled)) && (https_enabled === 'true' || https_enabled === 'yes')) {
        https_enabled = true;
    } else {
        https_enabled = false;
    }

    // Register various middleware functions
    // Logging of the request
    app.use(morgan('combined'));

    // Removed the "X-Powered-By" header (reduce bandwidth a bit).
    app.disable('x-powered-by');

    // This custom middleware is what sets the 'rawBody' property
    app.use(function(req, res, next) {
        var data = '';
        req.setEncoding('utf8');

        req.on('data', function(chunk) {
            data += chunk;
        });

        req.on('end', function() {
            req.rawBody = data;
            next();
        });
    });

    // Node handler functions
    var routes = require('routes');
    routes.set_routes(app);

    var bind_address = config.value('global', 'bind_address');
    var port = config.value('global', 'port');

    // Check that we have some valid settings.
    if (_.isNil(bind_address) || bind_address.length === 0) {
        var bind_err = "The 'bind_address' setting is not configured.";
        console.log(bind_err);
        process.send({ cmd: 'abort', reason: bind_err });
    }

    if (_.isNil(port) || port.length === 0) {
        var port_err = "The 'port' setting is not configured.";
        console.log(port_err);
        process.send({ cmd: 'abort', reason: port_err });
    }

    process.on('uncaughtException', function(err) {
        logger.error('Caught exception: ' + err);
        logger.error(err.stack);
        console.log('Check log file for stack trace. Caught exception: ' + err);
    });

    process.on('message', function(msg) {
        if (msg && _.has(msg, 'cmd')) {
            logger.info('Got a message from the master: ' +  msg['cmd']);
        }
    });

    if (https_enabled) {
        logger.info('Using encrypted https.');

        // Need the key and cert to establish the SSL enabled server
        get_ssl_options(config, function(err, options) {
            if (err) {
                logger.error('Unable to configure SSL: ' + err.message);
                process.send({ cmd: 'abort', reason: err.message });
            } else {
                var https = require('https');
                var server  = https.createServer(options, app);
                server.listen(port, bind_address);
            }
        });
    } else {
        logger.info('Using regular http (unencrypted).');
        // Just use regular http
        var http = require('http');
        var server  = http.createServer(app);
        server.listen(port, bind_address);
    }

    // If we are being started via sys-v style init scripts we are probably being
    // invoked as root. If we need to listen on a well known port, we need to be
    // launched as root to bind to the port, but then drop down to another UID.
    if (process.getuid() === 0) {
        // Who do we drop privileges to?
        var user = config.value('global', 'user');
        if (user === null) {
            console.log("The 'user' setting is not configured.");
            process.exit(1);
        }

        console.log('Launched as root. Switching to ' + user);
        process.setuid(user);
    }
}

// This function sets up the mechanism to wait for all the handlers
// to be ready by acting upon events that are emitted by the handlers
// when they are finished. When all the events are received, we're ready
// to proceed, and launch() is called.
function listen_for_init_completion(config) {
    var handlers = [ 'object' ];
    var handler_count = 0;

    var examine_handlers = function() {
        if (++handler_count === handlers.length) {
            console.log('Handlers initialized for worker with PID ' +
                        process.pid + '.');

            // Send message to master process
            process.send({ cmd: 'init_completed' });

            // You may fire when ready, Gridley...
            try {
                launch(config);
            } catch (err) {
                process.send({ cmd: 'abort', reason: err.message });
            }
        }
    };

    // Allow each handler to abort the launch if there is a configuration
    // problem somewhere. For example, maybe CouchDB or ElasticSearch are down.
    _.each(handlers, function(handler) {
        eventEmitter.on(handler + '_handler_initialized', function(message) {
            examine_handlers();
        });

        eventEmitter.on(handler + '_handler_aborted', function(message) {
            console.error('Got an abort from ' + handler +
                          ' handler. Reason: ' + message);
            process.send({ cmd: 'abort', reason: message });
        });
    });
}

function get_ssl_options(config, callback) {
    logger.debug('In get_ssl_options.');

    parallel([
        function(callback) {
            var ca_file = config.value('global', 'ca_file');
            var ca = [];
            if (ca_file == undefined || ca_file == null) {
                logger.debug('Certificate Authority (CA) listing not set.');
                // This will return an empty array
                callback(null, ca);
            } else {
                logger.debug('Certificate Authority (CA) file listing found.');

                fs.readFile(ca_file, 'utf8', function(err, chain) {
                    var chain_files = chain.split('\n');
                    chain_files = _.without(chain_files, '');
                    logger.debug('Number of CA chain files to read: ' +
                                 chain_files.length);

                    each(chain_files, function(file, cb) {
                        logger.debug('Reading file ' + file);
                        fs.readFile(file, 'utf8', function(err, data) {
                            if (err) {
                                cb(err);
                            } else {
                                ca.push(data);
                                cb();
                            }
                        });
                    },
                    function(err) {
                        if (err) {
                            logger.error(err);
                            callback(err, null);
                        } else {
                            // Return the array of CA data...
                            logger.debug('Completed reading SSL CA files.');
                            callback(null, ca);
                        }
                    });
                });
            }
        },
        function(callback) {
            var key_file = config.value('global', 'key_file');
            if (key_file == undefined || key_file == null) {
                callback('key_file not set in configuration file.', null);
                return;
            }

            logger.debug('Reading key_file ' + key_file);
            fs.readFile(key_file, 'utf8', function(err, data) {
                if (err) {
                    logger.error('Error reading SSL key file.', err);
                    callback(err, null);
                } else {
                    callback(null, data);
                }
            });
        },
        function(callback) {
            var cert_file = config.value('global', 'cert_file');
            if (cert_file == undefined || cert_file == null) {
                callback('cert_file not set in configuration file.', null);
                return;
            }

            logger.debug('Reading cert_file ' + cert_file);

            fs.readFile(cert_file, 'utf8', function(err, data) {
                if (err) {
                    logger.error('Error reading SSL cert file.', err);
                    callback(err, null);
                } else {
                    callback(null, data);
                }
            });
        }
    ],
    function(err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
        } else {
            var ca = results[0];
            var key = results[1];
            var cert = results[2];

            var options = {
                ca: ca,
                key: key,
                cert: cert
            };

            callback(null, options);
        }
    });
}

exports.start_worker = function(config, working_path) {
    // Wait for everything to be ready before we get going.
    listen_for_init_completion(config);
    initialize(working_path);
};
