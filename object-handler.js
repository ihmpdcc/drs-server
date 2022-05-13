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
    logger.debug('In {} init().'.format(path.basename(__filename)));

    retriever = ObjectRetrieve.get_instance(config);

    retriever.establish_db_connection(function(success, err) {
        if (err) {
            emitter.emit('object_handler_aborted', err);
        } else {
            emitter.emit('object_handler_initialized');
        }
    });
};

exports.get_object_access_url = function(request, response) {
    logger.debug('In get_object.');

    let obj_id = request.params.object_id;
    let full_given_access_id = request.params.access_id;

    let expand = false;

    retriever.build_object(obj_id, expand, function(data, err) {
        if (err) {
            drs_utils.send_error(response, 'An error occurred.', 500);
        } else {
            if (_.isArray(data) && data.length === 0) {
                drs_utils.send_error(response, 'No DRS object with that id found.', 404);
            } else {
                // Compare the given access_id, to the one we have computed...
                //
                // The full access id will contain a hyphen followed by a number. These
                // are used to disambiguate access_ids when there is more than 1 access_url.
                // They are essentially numbered. So we split that part off and only
                // compare the prefix portion.
                let access_id = drs_utils.generate_access_id(obj_id);
                let full_array = full_given_access_id.split('-');
                let access_id_number = parseInt(full_array[1], 10);
                let given_access_id = full_array[0];

                if (given_access_id !== access_id) {
                    logger.info('Access ID provided is invalid. Given {} != {}.'.format(
                        given_access_id, access_id
                    ));

                    drs_utils.send_error(response, 'Access ID is invalid.', 403);
                } else {
                    let access_methods = data['access_methods'];

                    if ((access_id_number <= 0) || (access_id_number > access_methods.length)) {
                        logger.info('Access method index given is invalid or out of range.');
                        drs_utils.send_error(response, 'Access method index is invalid.', 403);
                    } else {
                        let access_method = access_methods[access_id_number - 1];
                        let access_url = access_method['access_url'];
                        response.json(access_url);
                    }
                }
            }

            return;
        }

        return;
    });
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
    let ok = 'OK';
    let not_ok = 'NOT_OK';

    let con = retriever.get_connection();

    if (con.state === 'authenticated') {
        con.ping(function(err) {
            if (err) {
                response.status(500).send(not_ok);
            } else {
                response.status(200).send(ok);
            }
        });
    } else {
        response.status(500).send(not_ok);
    }
};

exports.update = function(request, response) {
    config.reload();
};
