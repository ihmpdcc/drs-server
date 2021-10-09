#!/usr/bin/env mocha

let _ = require('lodash');
let assert = require('chai').assert;
let DrsObject = require('drs-object');
let AccessMethod = require('access-method');

describe('drs_object', function() {
    it('instantiation', function(done) {
        try {
            let blob = new DrsObject(1, 'blob_a', 123456);
            assert.instanceOf(blob, DrsObject, 'Return is instance of DrsObject.');
            done();
        } catch (err) {
            done(new Error('Unable to instantiate.'));
        }
    });


    it('to_obj', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let am = new AccessMethod('s3://path/to/s3/file', 's3');
        am.add_header('authorization', 'whatever');
        blob.add_access_method(am);

        let obj = blob.to_obj();

        let keys = [
            'access_methods', 'checksums', 'created_time', 'drs_id', 'id', 'self_uri', 'size'
        ];

        assert.hasAllKeys(obj, keys);

        done();
    });

    it('to_json', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let am = new AccessMethod('s3://path/to/s3/file', 's3');
        am.add_header('authorization', 'whatever');
        blob.add_access_method(am);

        let output = blob.to_json();

        try {
            JSON.parse(output);
            done();
        } catch (err) {
            done(new Error('to_json() did not return valid JSON.'));
        }
    });

    it('set_access_method_on_bundle', function(done) {
        let bundle = new DrsObject(2, 'bundle_1', 314529);
        bundle.set_is_bundle();

        let am2 = new AccessMethod('s3://path/to/s3/file', 's3');
        am2.add_header('authorization', 'whatever');

        try {
            // This should throw an exception
            bundle.add_access_method(am2);
            done(new Error('Adding access method to bundle did not throw.'));
        } catch (err) {
            done();
        }
    });
});

