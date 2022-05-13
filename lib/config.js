const format = require('string-format');
const drs_utils = require('drs_utils');
const logger = drs_utils.get_logger();
const inireader = require('inireader');

format.extend(String.prototype);

// This is a truly simple javascript class to aid
// in the retrieval of values from the DRS configuration
// file.
var config = (function() {
    this.parser = new inireader.IniReader();
    this.instance = null;

    return this;
})();

// This method is used to retrieve data from the
// configuration file.
//
// section - The INI section that the key is found under
// key - The name of the parameter to get the value for
// obscure - Optional argument to suppress the value from being logged.
//           Useful for when loading password from the configuration.
//
// Example:
//     var server = c.value("database", "server");
//
// Suppress logging of the value:
//     var server = c.value("database", "server", true);
function value(section, key, obscure = false) {
    logger.debug('Retrieving config parameter "{}" from section "{}".'.
        format(key, section));

    let config_value = config.parser.param(section + '.' + key);

    let logged_value = obscure ? 'XXXXXXX' : config_value;

    logger.debug('Value for "{}": "{}".'.format(key, logged_value));

    return config_value;
}

function reload() {
    config.parser.load(config.file);
}

function load(file) {
    logger.debug('In load.');

    if (config.instance === null) {
        logger.debug('Loading file ' + file);
        config.parser.load(file);
    }

    return this;
}

module.exports.load = load;
module.exports.reload = reload;
module.exports.value = value;
