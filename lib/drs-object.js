let _ = require('lodash');
let format = require('string-format');

format.extend(String.prototype);

module.exports = class DrsObject {

    static #drs_domain = 'drs.hmpdacc.org';

    constructor(id, drs_id, size) {
        this.id = id;
        this.drs_id = drs_id;
        this._size = size;
        this.is_blob = true;
    }

    add_access_method(access_method) {
        // Only blob's have access methods
        if (! this.is_blob) {
            throw new Error('Cannot set access methods on a bundle.');
        }

        if (_.isUndefined(this.access_methods) || _.isNull(this.access_methods)) {
            this.access_methods = [];
        }

        this.access_methods.push(access_method);
    }

    get contents() {
        return this._contents;
    }

    set contents(contents) {
        // Only blob's have access methods
        if (this.is_blob) {
            throw new Error('Cannot set contents on a blob.');
        }

        this._contents = contents;
    }

    get created_time() {
        return this._created_time;
    }

    set created_time(created_time) {
        if (! _.isDate(created_time)) {
            throw new Error('Invalid date. Must be a Date object.');
        }

        this._created_time = created_time;
    }

    get description() {
        return this._description;
    }

    set description(description) {
        if (! _.isString(description)) {
            throw new Error('Invalid description. Must be a string.');
        }

        this._description = description;
    }

    get md5_checksum() {
        return this._md5;
    }

    set md5_checksum(md5) {
        if (! _.isString(md5)) {
            throw new Error('MD5 checksum must be a string.');
        }

        if (md5.length !== 32) {
            throw new Error('Invalid MD5 checksum.');
        }

        this._md5 = md5;
    }

    get mime_type() {
        return this._mime_type;
    }

    set mime_type(mime_type) {
        if (! _.isString(mime_type)) {
            throw new Error('MIME type must be a string.');
        }

        this._mime_type = mime_type;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        if (! _.isString(name)) {
            throw new Error('Name must be a string.');
        }

        this._name = name;
    }

    get sha256_checksum() {
        return this._sha256;
    }

    set sha256_checksum(sha256) {
        if (! _.isString(sha256)) {
            throw new Error('SHA256 checksum must be a string.');
        }

        if (sha256.length !== 64) {
            throw new Error('Invalid SHA256 checksum.');
        }

        this._sha256 = sha256;
    }

    get size() {
        return this._size;
    }

    set size(size) {
        if (! _.isNumber(size)) {
            throw new Error('Size must be a number.');
        }

        if (size < 0) {
            throw new Error('Size must non-negative.');
        }

        this._size = size;
    }

    get updated_time() {
        return this._updated_time;
    }

    set updated_time(updated_time) {
        if (! _.isDate(updated_time)) {
            throw new Error('Invalid date. Must be a Date object.');
        }

        this._updated_time = updated_time;
    }

    get version() {
        return this._version;
    }

    set version(version) {
        if (! _.isString(version)) {
            throw new Error('Version must be a string.');
        }

        this._version = version;
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
            created_time: this._created_time,
            drs_id: this.drs_id,
            checksums: [
                {
                    checksum: this.md5,
                    type: 'md5'
                }
            ],
            self_uri: 'drs://{}/{}'.format(DrsObject.#drs_domain, this.drs_id),
            size: this._size
        };

        if (! _.isNil(this.sha256)) {
            obj['checksums'].push(
               {
                   'checksum': this.sha256,
                   'type': 'sha-256'
               }
            );
        }

        // If available, add the description, which is optional.
        if (! _.isNil(this._description)) {
            obj['description'] = this._description;
        }

        // If available, add the mime type, which is optional.
        if (! _.isNil(this._mime_type)) {
            obj['mime_type'] = this._mime_type;
        }

        // If available, add the name, which is optional.
        if (! _.isNil(this._name)) {
            obj['name'] = this._name;
        }

        // If available, add the updated time, which is optional.
        if (! _.isNil(this._updated_time)) {
            obj['updated_time'] = this._updated_time;
        }

        // If available, add the updated version, which is optional.
        if (! _.isNil(this._version)) {
            obj['version'] = this._version;
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
