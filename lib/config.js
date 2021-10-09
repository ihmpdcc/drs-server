var format = require('string-format');
var drs_utils = require('drs_utils');
var logger = drs_utils.get_logger();
var inireader = require('inireader');

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
//
// Example:  var server = c.value("database", "server");
function value(section, key) {
    //return this.parser.param(section + '.' + key);
    logger.debug('Retrieving config parameter "{}" from section "{}".'.
        format(key, section));

    var value = config.parser.param(section + '.' + key);

    logger.debug('Value for "{}": "{}".'.format(key, value));
    return value;
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
