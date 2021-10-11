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

    it('created_time must be a date object', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.created_time = 1234;
        }, /.+Date.*/);

        done();
    });

    it('description accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let description = 'test_description';
        blob.description = description;

        assert.equal(blob.description, description, 'description accessors work.');

        done();
    });

    it('description must be a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.description = 1234;
        }, /.+string.*/);

        done();
    });

    it('md5 accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let md5 = '098f6bcd4621d373cade4e832627b4f6';
        blob.md5_checksum = md5;

        assert.equal(blob.md5_checksum, md5, 'md5_checksum accessors work.');

        done();
    });

    it('md5 must be a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.md5_checksum = 1234;
        }, /.+string.*/);

        done();
    });

    it('md5 must have a length of 32', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.md5_checksum = '098f6bcd4621d3';
        }, /.+valid.*/);

        done();
    });

    it('mime_type accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let mime_type = 'application/octet-stream';
        blob.mime_type = mime_type;

        assert.equal(blob.mime_type, mime_type, 'mime_type accessors work.');

        done();
    });

    it('mime_type must be a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.mime_type = 1234;
        }, /.+string.*/);

        done();
    });

    it('name accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let name = 'test_name';
        blob.name = name;

        assert.equal(blob.name, name, 'name accessors work.');

        done();
    });

    it('name must be a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.name = 1234;
        }, /.+string.*/);

        done();
    });

    it('sha256 accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        let sha = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        blob.sha256_checksum = sha;

        assert.equal(blob.sha256_checksum, sha, 'sha256_checksum accessors work.');

        done();
    });

    it('sha256 must a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.sha256_checksum = 1234;
        }, /.+string.*/);

        done();
    });

    it('sha256 must have a length of 64', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.sha256_checksum = '098f6bcd4621d3';
        }, /.+valid.*/);

        done();
    });

    it('size accessors', function(done) {
        let initial_size = 123456;
        let blob = new DrsObject(1, 'blob_a', initial_size);

        assert.equal(blob.size, initial_size, 'size getter works.');

        let new_size = 234567;
        blob.size = new_size;

        assert.equal(blob.size, new_size, 'size setter works.');

        done();
    });

    it('size must numeric', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.size = 'test';
        }, /.+(number|numeric).*/);

        done();
    });

    it('size must be non-negative', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.size = -1000;
        }, /.+negative.*/);

        done();
    });

    it('updated_time must be a date object', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.updated_time = 1234;
        }, /.+Date.*/);

        done();
    });

    it('version accessors', function(done) {
        let blob = new DrsObject(1, 'blob_a', 1234);

        let new_version = '2';
        blob.version = new_version;

        assert.equal(blob.version, new_version, 'version accessors work.');

        done();
    });

    it('version must be a string', function(done) {
        let blob = new DrsObject(1, 'blob_a', 123456);

        assert.throws(function() {
            blob.version = 1234;
        }, /.+string.*/);

        done();
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

