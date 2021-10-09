let _ = require('lodash');
let format = require('string-format');

format.extend(String.prototype);

module.exports = class DrsObject {

    static #drs_domain = 'drs.hmpdacc.org';

    constructor(id, drs_id, size) {
        this.id = id;
        this.drs_id = drs_id;
        this.size = size;
        this.is_blob = true;
    }

    add_access_method(access_method) {
        // Only blob's have access methods
        if (! this.is_blob) {
            throw 'Cannot set access methods on a bundle.';
        }

        if (_.isUndefined(this.access_methods) || _.isNull(this.access_methods)) {
            this.access_methods = [];
        }

        this.access_methods.push(access_method);
    }

    set_contents(contents) {
        // Only blob's have access methods
        if (this.is_blob) {
            throw 'Cannot set contents on a blob.';
        }

        this.contents = contents;
    }

    set_created_time(created_time) {
        this.created_time = created_time;
    }

    set_description(description) {
        this.description = description;
    }

    set_md5_checksum(md5_hash) {
        this.md5 = md5_hash;
    }

    set_mime_type(mime_type) {
        this.mime_type = mime_type;
    }

    set_name(name) {
        this.name = name;
    }

    set_sha256_checksum(sha256_hash) {
        this.sha256 = sha256_hash;
    }

    set_updated_time(updated_time) {
        this.updated_time = updated_time;
    }

    set_version(version) {
        this.version = version;
    }

    set_is_blob() {
        this.is_blob = true;
    }

    set_is_bundle() {
        this.is_blob = false;
    }

    to_obj() {
        // Create the base object, then add the optional properties if they
        // are available.
        let obj = {
            id: this.id,
            created_time: this.created_time,
            drs_id: this.drs_id,
            checksums: [
                {
                    checksum: this.md5,
                    type: 'md5'
                }
            ],
            self_uri: 'drs://{}/{}'.format(DrsObject.#drs_domain, this.drs_id),
            size: this.size
        };

        if (! _.isUndefined(this.sha256) && ! _.isNull(this.sha256)) {
            obj['checksums'].push(
               {
                   'checksum': this.sha256,
                   'type': 'sha-256'
               }
            );
        }

        // If available, add the mime type, which is optional.
        if (! _.isUndefined(this.mime_type) && ! _.isNull(this.mime_type)) {
            obj['mime_type'] = this.mime_type;
        }

        // If available, add the name, which is optional.
        if (! _.isUndefined(this.name) && ! _.isNull(this.name)) {
            obj['name'] = this.name;
        }

        // If available, add the updated time, which is optional.
        if (! _.isUndefined(this.updated_time) && ! _.isNull(this.updated_time)) {
            obj['updated_time'] = this.updated_time;
        }

        // If available, add the updated version, which is optional.
        if (! _.isUndefined(this.version) && ! _.isNull(this.version)) {
            obj['version'] = this.version;
        }

        if (this.is_blob) {
            // This object is a blob, so must have an 'access_methods' key.
            obj['access_methods'] = [];

            _.forEach(this.access_methods, function(access_method) {
                obj['access_methods'].push(access_method.to_obj());
            });
        } else {
            // This object is a bundle, so it must have a 'contents' key.
            obj['contents'] = this.contents || [];
        }

        return obj;
    }

    to_json() {
        return JSON.stringify(this.to_obj());
    }
};
