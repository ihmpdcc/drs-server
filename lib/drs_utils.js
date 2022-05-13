// _ (lodash) - For basic utility functions
// crypto     - For generating MD5 checksums
// fs         - For filesystem operations
// path       - For filesystem path operations
// util       - For access to the inspect() functionality

const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

let working_dir;
let config_path = null;
let logger = null;

/**
 * Establishes the logging and sets the logger object for the application.
 *
 * @param {string} log_file The path to the log file to log to.
 */
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

/**
 * Calculates the MD5 hash of a string.
 *
 * @param {string} string The string to compute the hash of.
 * @return {string} The MD5 hash.
 */
exports.calculate_md5 = function(string) {
    return crypto.createHash('md5').update(string).digest('hex');
};

/**
 * Sets the log file path.
 *
 * @param {string} log_file_path The path to the log file to use.
 */
exports.generate_access_id = function(object_id) {
    let md5sum = exports.calculate_md5(object_id);

    // Take just the first 10 characters to keep things friendly, yet have a large
    // enough space to make it legitimate.
    let access_id = md5sum.slice(0, 10);

    return access_id;
};

/**
 * Sets the log file path.
 *
 * @param {string} log_file_path The path to the log file to use.
 */
exports.set_log_file = function(log_file_path) {
    set_logging(log_file_path);
};

/**
 * Returns the log4js logger.
 *
 * @return {object} The log4js logger object.
 */
exports.get_logger = function() {
    if (_.isNil(logger)) {
        let log_file_path =
            path.resolve(exports.get_drs_root(), 'logs/drs.log');

        set_logging(log_file_path);
    }

    return logger;
};

/**
 * Returns the path to the application's configuration file.
 *
 * @return {string} The path to the configuration file.
 */
exports.get_config = function() {
    if (_.isNil(config_path)) {
        config_path = path.resolve(exports.get_drs_root(), 'conf/config.ini');
    }

    return config_path;
};

/**
 * Sets the path of the configuration file to use.
 *
 * @param {string} config_file_path The path of the configuration file.
 */
exports.set_config = function(config_file_path) {
    config_path = config_file_path;
};

/**
 * Retrieves the path of the application working directory.
 *
 * @return {string} The configured working directory.
 */
exports.get_working_dir = function() {
    // If the working directory hasn't been set, then we use the default,
    // which is a directory called 'working' under the DRS root.
    if (_.isNil(working_dir)) {
        working_dir = path.resolve(exports.get_drs_root(), 'working');
    }

    return working_dir;
};

/**
 * @callback setWorkingDirCallback
 */

/**
 * Sets the working directory of the application from which the path
 * to other resources (such as the configuration file) are derived.
 *
 * @param {string} directory The path of the configuration file.
 * @param {setWorkingDirCallback} cb Callback called if there were no errors.
 */
exports.set_working_dir = function(directory, cb) {
    fs.stat(directory, function(err, stats) {
        if (err) {
            throw err;
        }

        if (stats.isDirectory()) {
            working_dir = directory;
            cb();
        } else {
            throw new Error('Configured path to working area is not a ' +
                            'directory: ' + directory);
        }
    });
};

/**
 * Retrieves the path of the application's root directory, or home.
 *
 * @return {string} The path to the application's root.
 */
exports.get_drs_root = function() {
    return path.resolve(__dirname, '..');
};

/**
 * Checks a string for white space.
 *
 * @return {boolean} Whether the string has white space or not.
 */
exports.has_white_space = function(string) {
    return (/\s/).test(string);
};

/**
 * Sends an HTTP error response with a given error message in
 * a X-HMP-DRS-Error custom 'X' header.
 *
 * @param {object} The HTTP response object.
 * @param {string} The error message string to report.
 * @param {number} The numeric HTTP error code (eg. 500).
 */
exports.send_error = function(response, error_message, http_code) {
    response.set('X-HMP-DRS-Error', error_message);
    response.status(http_code).json({
        'msg': error_message,
        'status_mode': http_code
    });
};

/**
 * At the debug logging level, log the contents of a given object. Note that the
 * object, if it has nested objects, will be fully recursed so that the entirety
 * of the contents will be shown.
 *
 * @param {object} The object to inspect into the logger.
 */
exports.log_obj = function log_obj(obj) {
    logger.debug(
        util.inspect(obj, {showHidden: false, depth: null, colors: false})
    );
};
