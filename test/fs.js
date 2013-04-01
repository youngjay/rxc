var assert = require("assert")
var slice = [].slice;
var rx = require('../index')
var rfs = require('../fs');
var path = require('path')

var DATA_FILE_DIR = path.join(__dirname, 'data');
var RECURSIVE_DIR = path.join(DATA_FILE_DIR, 'recursive');
var RECURSIVE_DIR_TEMP = path.join(DATA_FILE_DIR, 'recursive_temp');
var TXT1 = path.join(DATA_FILE_DIR, '1.txt');
var TXT2 = path.join(DATA_FILE_DIR, '2.txt');
var TXT1_CONTENT = '100'
var TXT2_CONTENT = '1000'

describe('fs', function() {
    describe('#readFile', function() {
        var file1 = rfs.readFile(TXT1, 'utf8'), file2 = rfs.readFile(TXT2, 'utf8');
       
        it('should readFile', function(done) {
            file1.subscribe(function() {
                assert.deepEqual(slice.call(arguments), [TXT1_CONTENT]);
                done();
            })
        })

        it('rx merge file', function(done) {
            rx(file1, file2).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [TXT1_CONTENT, TXT2_CONTENT]);
                done();
            })
        })
    })

    describe('#readdirr', function() {
        

        it('should read all files right', function(done) {
            rfs.readdirr(RECURSIVE_DIR).subscribe(function(files) {
                assert.equal(files.length, 3);
                done();
            })
        })

        it('should read all files right include hidden file', function(done) {
            rfs.readdirr(RECURSIVE_DIR, {
                hidden: true
            }).subscribe(function(files) {
                assert.equal(files.length, 5);
                done();
            })
        })

        it('should read all files right include directory', function(done) {
            rfs.readdirr(RECURSIVE_DIR, {
                directory: true
            }).subscribe(function(files) {
                assert.equal(files.length, 5);
                done();
            })
        })

        it('should read all files right include hidden file and directory', function(done) {
            rfs.readdirr(RECURSIVE_DIR, {
                hidden: true,
                directory: true
            }).subscribe(function(files) {
                assert.equal(files.length, 8);
                done();
            })
        })
    })

    describe('#cpr', function() {
        it('should cp recursive', function(done) {
            rfs.cpr(RECURSIVE_DIR, RECURSIVE_DIR_TEMP).then(function() {
                return rfs.readdirr(RECURSIVE_DIR_TEMP, {
                    hidden: true
                })
            }).subscribe(function(files) {
                assert.equal(files.length, 5);
                done();
            })
        })
    })

    describe('#rmr', function() {
        
        it('should rm recursive', function(done) {
            rfs.rmr(RECURSIVE_DIR_TEMP).then(function(callback) {
                callback(rfs.exists(RECURSIVE_DIR_TEMP))
            }).subscribe(function(exists) {
                assert.equal(exists, false);
                done();
            });
        })

        it('should rm recursive accept not exists dir', function(done) {
            rfs.rmr('some_fake_dir').subscribe(function() {
                done();
            })
        })
    })
});