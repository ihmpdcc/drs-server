#!/usr/bin/env mocha

const _ = require('lodash');
const assert = require('chai').assert;
let AccessMethod = require('access-method');

const dummy_s3_path = 's3://path/to/object';

describe('access_method', function() {
    it('instantiation', function(done) {
        let am = null;

        assert.doesNotThrow(function() {
            am = new AccessMethod(dummy_s3_path, 's3');
        });

        assert.instanceOf(am, AccessMethod, 'Return is instance of AccessMethod.');

        done();
    });

    it('add_header', function(done) {
        let am = new AccessMethod(dummy_s3_path, 's3');

        let obj = am.to_obj();

        // Check that the headers key is not there yet
        assert.notProperty(obj, 'headers');

        // Add a header
        am.add_header('something', 'of_value');

        obj = am.to_obj();

        // Now we should have the headers key
        assert.property(obj, 'headers');
        let header = obj['headers'].pop();

        assert.property(header, 'header');
        assert.property(header, 'value');

        assert.equal(header['header'], 'something');
        assert.equal(header['value'], 'of_value');

        done();
    });

    it('invalid_instantiation', function(done) {
        assert.throws(function() {
            let am = new AccessMethod();
        }, /.+provide.+url/);

        assert.throws(function() {
            let am = new AccessMethod(dummy_s3_path);
        }, /.+provide.+type/);

        assert.throws(function() {
            let am = new AccessMethod(null, null);
        }, /.+provide.+url/);

        done();
    });

    it('invalid_type', function(done) {
        let am = null;

        assert.throws(function() {
            am = new AccessMethod(dummy_s3_path, 'blah');
        }, /Invalid/);

        done();
    });

    it('set_region', function(done) {
        let type = 's3';
        let am = new AccessMethod(dummy_s3_path, type);

        let region = 'us-east-1';
        am.set_region(region);

        let obj = am.to_obj();

        assert.property(obj, 'region');
        assert.equal(obj['region'], region);

        done();
    });

    it('to_json', function(done) {
        let type = 's3';
        let am = new AccessMethod(dummy_s3_path, type);

        let output = am.to_json();
        let obj = null;

        try {
            obj = JSON.parse(output);
        } catch (err) {
            done(new Error('to_json() did not return valid JSON.'));
        }

        assert.equal(obj['type'], type);
        assert.property(obj, 'access_url');
        assert.property(obj['access_url'], 'url');
        assert.equal(obj['access_url']['url'], dummy_s3_path);

        done();
    });

    it('to_obj', function(done) {
        let type = 's3';
        let am = new AccessMethod(dummy_s3_path, type);

        let obj = am.to_obj();

        assert.isNotNull(obj, 'Object is not null.');

        assert.equal(obj['type'], type);
        assert.property(obj, 'access_url');
        assert.property(obj['access_url'], 'url');
        assert.equal(obj['access_url']['url'], dummy_s3_path);

        done();
    });
});

