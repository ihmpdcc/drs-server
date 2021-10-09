let obj_handler = require('object-handler');

const DRS_PREFIX = '/ga4gh/drs/v1';

function make_drs(app, suffix, func) {
    app.get(DRS_PREFIX + suffix, func);
}

exports.set_routes = function(app) {
    // Object handler functions
    make_drs(app, '/objects/:object_id', obj_handler.get_object);
    make_drs(app, '/objects/:object_id/access/:access_id', obj_handler.get_object_access_url);
    app.get('/status', obj_handler.get_status);
};
