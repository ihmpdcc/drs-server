// log4js     - For logging at various levels and debugging

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const util = require('util');

let working_dir;
let config_path = null;
let logger = null;

function set_logging(log_file) {
    var log4js = require('log4js');

    log4js.configure({
        appenders: {
            out: { type: 'stdout' },
            app: { type: 'file', filename: log_file }
        },
        categories: {
            default: { appenders: [ 'out', 'app' ], level: 'debug' }
        }
    });

    // Set the logger
    logger = log4js.getLogger('app');
}

exports.set_log_file = function(log_file_path) {
    set_logging(log_file_path);
};

exports.get_logger = function() {
    if (_.isNil(logger)) {
        let log_file_path =
            path.resolve(exports.get_drs_root(), 'logs/drs.log');

        set_logging(log_file_path);
    }

    return logger;
};

exports.get_config = function() {
    if (_.isNil(config_path)) {
        config_path = path.resolve(exports.get_drs_root(), 'conf/config.ini');
    }
    return config_path;
};

exports.set_config = function(config_file_path) {
    config_path = config_file_path;
};

exports.set_working_dir = function(directory, cb) {
    fs.stat(directory, function(err, stats) {
        if (err) {
            throw err;
        }
        if (stats.isDirectory()) {
            working_dir = directory;
            cb();
        } else {
            throw 'Configured path to working area is not a directory: ' +
                  directory;
        }
    });
};

exports.get_working_dir = function() {
    // If the working directory hasn't been set, then we use the default,
    // which is a directory called 'working' under the DRS root.
    if (_.isNil(working_dir)) {
        working_dir = path.resolve(exports.get_drs_root(), 'working');
    }

    return working_dir;
};

exports.get_drs_root = function() {
    return path.resolve(__dirname, '..');
};

// Check for white space
exports.has_white_space = function(string) {
    return (/\s/).test(string);
};

exports.send_error = function(response, error_message, http_code) {
    response.set('X-HMP-DRS-Error', error_message);
    response.status(http_code).send('');
};

exports.log_obj = function log_obj(obj) {
    logger.debug(util.inspect(obj, {showHidden: false, depth: null, colors: false}));
};
