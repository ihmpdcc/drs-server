const _ = require('lodash');

module.exports = class AccessMethod {

    static #allowable_types = ["s3", "https", "gs", "ftp", "gsiftp", "globus", "htsget", "file"];

    constructor(url, am_type) {
        // isNil() checks for both null and undefined values.
        if (_.isNil(url)) {
            throw new Error('Must provide a url.');
        }

        if (_.isNil(am_type)) {
            throw new Error('Must provide a type.');
        }

        if (_.includes(AccessMethod.#allowable_types, am_type)) {
            this._type = am_type;
        } else {
            throw new Error('Invalid access method type.');
        }

        this._url = url;
        this._headers = [];
        this._region = null;
    }

    get region() {
        return this._region;
    }

    set region(region) {
        if (! _.isString(region)) {
            throw new Error('Region must be a string.');
        }

        this._region = region;
    }

    get type() {
        return this._type;
    }

    set type(am_type) {
        if (! _.isString(am_type)) {
            throw new Error('Type must be a string.');
        }

        if (! _.includes(AccessMethod.#allowable_types, am_type)) {
            throw new Error('Invalid access method type.');
        }

        this._type = am_type;
    }

    get url() {
        return this._url;
    }

    set url(url) {
        if (! _.isString(url)) {
            throw new Error('URL must be a string.');
        }

        this._url = url;
    }

    add_header(name, value) {
        if (_.isString(name) && _.isString(value)) {
            this._headers.push({
                header: name,
                value: value
            });
        } else {
            throw new Error('Both arguments to add_header() must be strings.');
        }
    }

    to_obj() {
        let obj = {
            access_url: {
              url: this._url
            },
            type: this._type
        };

        if (! _.isNil(this._region)) {
            obj['region'] = this._region;
        }

        if (this._headers.length > 0) {
            obj['headers'] = this._headers;
        }

        return obj;
    }

    to_json() {
        return JSON.stringify(this.to_obj());
    }
};
