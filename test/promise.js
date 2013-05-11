var Promise = require('../lib/promise');
var sinon = require('sinon');
var assert = require('assert');
var slice = [].slice;

describe('promise', function() {
    var r1 = new Promise(function(callback) {
        callback(1)
    });

    var a, b;

    beforeEach(function() {
        a = new Promise(function(callback) {
            callback(1, 2)
        });
        b = new Promise(function(callback) {
            callback(3, 4)
        });
    })

    describe('then', function() {
        it('should transform data', function() {
            r1.then(function(a, next) {
                next(a + 1);
            }).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [2])
            });
        });
    })

    describe('when', function() {

        it('args should be right1', function(done) {
            Promise.when(a, b).subscribe(function() {
                assert.equal(arguments.length, 4)
                assert.deepEqual(slice.call(arguments), [1,2,3,4]);
                done();
            });
        });

        it('args should be right2', function(done) {
            Promise.when([a, b]).subscribe(function() {
                assert.equal(arguments.length, 1)
                assert.deepEqual(slice.call(arguments), [[1,2,3,4]]);
                done();
            });
        });


        it('mutable should be merged', function(done) {
            Promise.when([a, b]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [[1,2,3,4]])
                done();
            });
        });

        it('mutable should be merged', function(done) {
            Promise.when(a, [a, [a, b]]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,[1,2, [1,2,3,4]]])
                done();
            });
        });

        it('immutable should be accept', function(done) {
            Promise.when(a, [a, [a, b, 10], 10]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,[1,2, [1,2,3,4, 10], 10]])
                done();
            });
        });

        it('nested rx should be accept', function(done) {
            var c = Promise.when(a, b);
            var d = Promise.when([a], c);

            d.subscribe(function() {
                assert.deepEqual(slice.call(arguments), [[1,2], 1,2,3,4])
                done();
            });
        })

    })

})