const util = require('util');
const path = require('path');
const config = require('config');
const drs_utils = require('drs_utils');
const mysql = require('mysql');
const logger = drs_utils.get_logger();
const _ = require('lodash');
const eachSeries = require('async/eachSeries');
const ObjectRetrieve = require('object-retrieve');

let retriever = null;

exports.init = function(emitter) {
    logger.debug('In ' + path.basename(__filename) + ' init().');

    retriever = ObjectRetrieve.getInstance(config);

    emitter.emit('object_handler_initialized');
};

exports.get_object_access_url = function(request, response) {
    logger.debug('In get_object.');
    var obj_id = request.params.object_id;
    var access_id = request.params.access_id;

    drs_utils.send_error(response, 'No access id is needed for HMP data.', 405);
};

exports.get_object = function(request, response) {
    let obj_id = request.params.object_id;
    logger.debug('In get_object: {}'.format(obj_id));

    let expand = (request.query.expand === 'true') ? true : false;
    logger.debug('Expanding results? {}'.format(expand));

    retriever.build_object(obj_id, expand, function(data, err) {
        if (err) {
            drs_utils.send_error(response, 'An error occurred.', 500);
        } else {
            if (_.isArray(data) && data.length === 0) {
                drs_utils.send_error(response, 'No DRS object with that id found.', 404);
            } else {
                response.json(data);
            }
        }

        return;
    });
};

// This function is used to allow an easy check on the availability and health
// of the server. However, it can also be used by a load balancer to check the
// health of a backend target service, as in the case of running the service in
// a cloud provider such as AWS.
exports.get_status = function(request, response) {
    let status = 'OK';

    let con = retriever.get_connection();

    if (con.state === 'authenticated') {
        response.status(200).send(status);
    } else {
        response.status(500).send('NOT_OK');
    }
};

exports.update = function(request, response) {
    config.reload();
};
