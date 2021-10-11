const util = require('util');
const path = require('path');
const config = require('config');
const drs_utils = require('drs_utils');
const mysql = require('mysql');
const logger = drs_utils.get_logger();
const _ = require('lodash');
const eachSeries = require('async/eachSeries');
const drs_object = require('drs-object');
const access_method = require('access-method');

let con = null;
let drs_domain = null;
let max_recursion = null;

const query = ' \
    (SELECT \
      o.id, o.drs_id, o.name, o.description, o.size, o.mime_type, \
      o.md5_checksum, o.sha256_checksum, o.created_time, \
      o.updated_time, o.version, o.is_blob, ob.drs_id AS parent_drs_id, \
      ob.id AS parent_id, am.id AS access_method_id, am.url, am.type, \
      am.region, h.name AS header, h.value \
    FROM objects AS o LEFT OUTER JOIN ( \
      containerships c INNER JOIN objects ob ON c.parent_id = ob.id \
    ) ON o.id = c.object_id \
    LEFT OUTER JOIN access_methods am ON o.id = am.blob_id \
    LEFT OUTER JOIN headers h on am.id = h.access_method_id \
    WHERE o.drs_id = ? \
    ORDER BY parent_id) \
    UNION \
    (SELECT \
      o.id, o.drs_id, o.name, o.description, o.size, o.mime_type, \
      o.md5_checksum, o.sha256_checksum, o.created_time, \
      o.updated_time, o.version, o.is_blob, ob.drs_id AS parent_drs_id, \
      ob.id AS parent_id, am.id AS access_method_id, am.url, am.type, \
      am.region, h.name AS header, h.value \
    FROM objects AS o LEFT OUTER JOIN ( \
      containerships c INNER JOIN objects ob ON c.parent_id = ob.id \
    ) ON o.id = c.object_id \
    LEFT OUTER JOIN access_methods am ON o.id = am.blob_id \
    LEFT OUTER JOIN headers h on am.id = h.access_method_id \
    WHERE ob.drs_id = ? \
    ORDER BY parent_id);';

class PrivateObjectRetrieve {
    constructor(config) {
        logger.debug('Initializing ' + path.basename(__filename) + '.');

        drs_domain = config.value('global', 'drs_domain');
        logger.info('DRS domain: {}.'.format(drs_domain));

        max_recursion = config.value('global', 'max_recursion');
        logger.info('Max recursion: {}.'.format(max_recursion));
    }

    establish_db_connection(cb) {
        logger.debug('In establish_db_connection.');

        start_connection(function(success, err) {
            if (err) {
                cb(null, err);
            } else {
                cb(true, null);
            }
        });
    }

    get_connection() {
        return con;
    }

    build_object(obj_id, expand, cb) {
        logger.debug('In build_object: {}'.format(obj_id));
        logger.debug('Expanding results? {}'.format(expand));

        query_data(obj_id, function(data, err) {
            if (err) {
                logger.error(err);
                cb(null, err);

                return;
            } else {
                // First check if we got anything back.
                if (data.length == 0) {
                    // No data found, return an empty array
                    cb([], null);
                    return;
                }

                data = collapse_data(data);

                let object = {};

                let drs_obj_data = data[_.keys(data)[0]];

                build_drs_object(obj_id, expand, drs_obj_data, function(object, err) {
                    if (err) {
                        cb(null, err);
                    } else {
                        cb(object, null);
                    }
                });
            }
        });
    }
}

class ObjectRetrieve {
    constructor() {
        throw new Error('Use get_instance()!');
    }

    static get_instance(config) {
        if (! ObjectRetrieve.instance) {
            ObjectRetrieve.instance = new PrivateObjectRetrieve(config);
        }

        return ObjectRetrieve.instance;
    }
}

module.exports = ObjectRetrieve;

function collapse_data(rows) {
    logger.debug('In collapse_data.');

    var collapsed = {};
    var access_methods = {};
    var headers = {};

    _.forEach(rows, function(row) {
        let drs_id = row['drs_id'];

        access_methods[drs_id] = access_methods[drs_id] || {};

        collapsed[drs_id] = {
            'id': row['id'],
            'drs_id': drs_id,
            'name': row['name'],
            'description': row['description'],
            'size': row['size'],
            'mime_type': row['mime_type'],
            'md5_checksum': row['md5_checksum'],
            'sha256_checksum': row['sha256_checksum'],
            'created_time': row['created_time'],
            'updated_time': row['updated_time'],
            'version': row['version'],
            'is_blob': row['is_blob'],
            'parent_drs_id': row['parent_drs_id'],
            'parent_id': row['parent_id']
        };

        var access_method = {
            'access_url': { 'url': row['url'] },
            'type': row['type']
        };

        // Add the region to the access method, if it's not null.
        if (! _.isNull(row['region'])) {
            access_method['region'] = row['region'];
        }

        var access_method_id = row['access_method_id'];

        if (! _.isNull(access_method_id)) {
            if (! _.isNull(row['header'])) {
                headers[drs_id] = headers[drs_id] || {};
                headers[drs_id][access_method_id] = headers[drs_id][access_method_id] || [];

                var header = {
                    'header': row['header'],
                    'value': row['value']
                };

                headers[drs_id][access_method_id].push(header);
            }
        }

        access_methods[drs_id][access_method_id] = access_method;
    });

    /*
     * Note: This is a pretty messy way to accomplish this, but a strange V8 bug
     * has prevented it from being done the obvious way. Will investigate
     * further with future releases.
     */

    // Add the headers to the appropriate access methods
    _.forOwn(headers, function(drs_id_headers, drs_id) {
        _.forOwn(drs_id_headers, function(access_method, access_method_id) {
            access_methods[drs_id][access_method_id]['access_url']['headers'] =
                headers[drs_id][access_method_id];
        });
    });

    // Add the access methods for the objects.
    _.forOwn(access_methods, function(drs_access_methods, drs_id) {
        _.forOwn(drs_access_methods, function(access_method, access_method_id) {
            collapsed[drs_id]['access_methods'] = collapsed[drs_id]['access_methods'] || [];
            collapsed[drs_id]['access_methods'].push(access_method);
        });
    });

    return collapsed;
}

function get_contents(obj_id, expand, depth, cb) {
    logger.debug('In get_contents: {}.'.format(obj_id));

    if (_.isNull(depth)) {
        depth = 1;
    } else {
        depth++;
    }

    logger.debug('Recursion depth: {}.'.format(depth));

    if (depth > max_recursion) {
        logger.warn('Exceeded the maximum recursion limit of {}.'.format(max_recursion));
        cb(null, 'Max recursion exceeded.');
        return;
    }

    let contents = [];

    query_data(obj_id, function(data, err) {
        if (err) {
            logger.error(err);
            cb(null, err);
            return;
        }

        data = collapse_data(data);
        let objects = data;

        delete objects[obj_id];
        objects = _.map(objects);

        eachSeries(objects, function(obj, inner_cb) {
            let obj_content = null;

            if (obj['is_blob'] === 'yes') {
                obj_content = format_contents(obj);
                contents.push(obj_content);
                inner_cb();
            } else {
                obj_content = format_contents(obj);
                obj_content['contents'] = [];

                if (expand) {
                    get_contents(obj['drs_id'], expand, depth, function(more, err) {
                        if (err) {
                            logger.error(err);
                            inner_cb(err);
                        } else {
                            obj_content['contents'] = more;
                            contents.push(obj_content);
                            inner_cb();
                        }
                    });
                } else {
                    // Abort the recursion since we are not in 'expand' mode.
                    contents.push(obj_content);
                    inner_cb();
                }
            }

        },
        function(err) {
            if (err) {
                cb(null, err);
            } else {
                cb(contents, null);
            }
        });
    });
}

function format_contents(data) {
    let contents = {
        name: data['name'] || data['drs_id'],
        id: 'drs://{}/{}'.format(drs_domain, data['drs_id']),
        drs_id: [ 'drs://{}/{}'.format(drs_domain, data['drs_id']) ]
    };

    return contents;
}

function query_data(obj_id, cb) {
    logger.debug('In query_data: {}.'.format(obj_id));

    let err = null;

    // Ensure we are connected to the database
    if (con.state === 'disconnected') {
        logger.info('Disconnected state. Attempting reconnection to db.');
        for (let attempt = 1; attempt <= 3; attempt++) {
            reconnect_to_db();

            if (con.state === 'authenticated') {
                break;
            }
        }
    }

    // If we are still disconnected, then the db must be down, or there is some
    // other problem.
    if (con.state === 'disconnected') {
        logger.error('Could not reconnect to database.');
        cb(null, "Can't establish database connection.");
        return;
    }

    con.query(query, [obj_id, obj_id], (error, results, fields) => {
        if (error) {
            console.error(error.message);
            logger.error(error.message);
            cb(null, error);
            return;
        }

        if (Array.isArray(results)) {
            // We unwrap the results from the RowDataPacket that the mysql
            // module wraps data in.
            let clean_results = [];
            _.forEach(results, function(value) {
                clean_results.push({...value});
            });

            cb(clean_results, err);
        } else {
            cb(results, err);
        }

        return;
    });
}

function reconnect_to_db() {
    start_connection();
}

function build_drs_object(obj_id, expand, data, cb) {
    logger.debug('In build_drs_object.');

    let obj = new drs_object(obj_id, obj_id, data['size']);

    obj.created_time = data['created_time'];

    if (! _.isNil(data['description'])) {
        obj.description = data['description'];
    }

    obj.md5_checksum = data['md5_checksum'];

    if (! _.isNil(data['sha256_checksum'])) {
        obj.sha256_checksum = data['sha256_checksum'];
    }

    if (! _.isNil(data['mime_type'])) {
        obj.mime_type = data['mime_type'];
    }

    if (! _.isNil(data['name'])) {
        obj.name = data['name'];
    }

    if (! _.isNil(data['updated_time'])) {
        obj.updated_time = data['updated_time'];
    }

    if (! _.isNil(data['version'])) {
        obj.version = data['version'];
    }

    if (data['is_blob'] === 'yes') {
        logger.debug('Building a blob (file).');

        // Add the access methods
        let access_methods = data['access_methods'];

        _.forEach(access_methods, function(am) {
            let url =  am['access_url']['url'];
            let headers = am['access_url']['headers'];

            let type = am['type'];
            let am_obj = new access_method(url, type);

            let region = am['region'];
            am_obj.region = region;

            _.forEach(headers, function(header) {
                am_obj.add_header(header['header'], header['value']);
            });

            // Add the access method object to the DRS object.
            obj.add_access_method(am_obj);
        });

        cb(obj.to_obj(), null);
    } else {
        logger.debug('Building a bundle (container).');

        obj.set_is_bundle();

        // Retrieve the, perhaps nested, contents block for the bundle
        get_contents(obj_id, expand, null, function(contents, err) {
            if (err) {
                logger.error(err);
                cb(null, err);
            } else {
                obj.contents = contents;

                cb(obj.to_obj(), null);
            }
        });
    }
}

function start_connection(cb) {
    logger.debug('In start_connection.');

    // Load the mysql connection parameters from the configuration file.
    let mysql_server = config.value('global', 'mysql_server');
    let mysql_dbname = config.value('global', 'mysql_dbname');
    let mysql_username = config.value('global', 'mysql_user');
    let mysql_password = config.value('global', 'mysql_pass');

    con = mysql.createConnection({
        host: mysql_server,
        user: mysql_username,
        password: mysql_password,
        database: mysql_dbname
    });

    con.connect(function(err) {
        if (err) {
            logger.error(
                'Unable to connect to the MySQL server {}. Reason: {}'.format(mysql_server, err)
            );

            cb(null, 'Unable to connect to the MySQL server {}.'.format(mysql_server));
        } else {
            logger.debug('Connected to MySQL server {}!'.format(mysql_server));
            cb(true, null);
        }
    });

    // Try to handle bad connection problems by reconnecting.
    con.on('error', function(err) {
        logger.error('Database problem: {}'.format(err));

        if (err.fatal) {
            logger.error('FATAL database error! Attempting to start a new connection.');
            start_connection(function() {
                logger.error('Still unable to connect.');
            });
        }
    });
}
