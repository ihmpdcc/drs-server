const _ = require('lodash');

module.exports = class AccessMethod {

    static #allowable_types = ["s3", "https", "gs", "ftp", "gsiftp", "globus", "htsget", "file"];

    constructor(url, type) {
        // isNil() checks for both null and undefined values.
        if (_.isNil(url)) {
            throw 'Must provide a url.';
        }

        if (_.isNil(type)) {
            throw 'Must provide a type.';
        }

        this.url = url;

        if (_.includes(AccessMethod.#allowable_types, type)) {
            this.type = type;
        } else {
            throw 'Invalid access method type.';
        }

        this.headers = [];
        this.region = null;
    }

    set_url(url) {
        this.url = url;
    }

    set_type(type) {
        this.type = type;
    }

    set_region(region) {
        this.region = region;
    }

    add_header(name, value) {
        this.headers.push({
            header: name,
            value: value
        });
    }

    to_obj() {
        let obj = {
            access_url: {
              url: this.url
            },
            type: this.type
        };

        if (! _.isUndefined(this.region) && ! _.isNull(this.region)) {
            obj['region'] = this.region;
        }

        if (this.headers.length > 0) {
            obj['headers'] = this.headers;
        }

        return obj;
    }

    to_json() {
        return JSON.stringify(this.to_obj());
    }
};
