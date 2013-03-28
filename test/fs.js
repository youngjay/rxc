var assert = require("assert")
var slice = [].slice;
var rx = require('../index')
var rfs = require('../fs');
var path = require('path')

var DATA_FILE_DIR = path.join(__dirname, 'data');
var RECURSIVE_DIR = path.join(DATA_FILE_DIR, 'recursive');
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

    describe('#readdirRecursive', function() {
        

        it('should read all files right', function(done) {
            rfs.readdirRecursive(RECURSIVE_DIR).subscribe(function(files) {
                assert.equal(files.length, 3);
                done();
            })
        })

        it('should read all files right include hidden file and dir', function(done) {
            rfs.readdirRecursive(RECURSIVE_DIR, {
                skipHidden: false
            }).subscribe(function(files) {
                assert.equal(files.length, 5);
                done();
            })
        })
    })
});