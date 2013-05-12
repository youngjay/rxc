var Promise = require('../lib/promise');
var sinon = require('sinon');
var assert = require('assert');
var slice = [].slice;

describe('promise', function() {
    var r1 = new Promise(function(callback) {
        callback(1)
    });

    var a, b;
     var spy 

    var clock;

    before(function () { clock = sinon.useFakeTimers(); });
    after(function () { clock.restore(); });

    beforeEach(function() {
        spy = sinon.spy();
        a = new Promise(function(callback) {
            callback(1, 2)
        });
        b = new Promise(function(callback) {
            callback(3, 4)
        });
    })

    describe('::new', function() {
        it('evaluate promise', function() {
            var a = new Promise(function(callback) {
                callback(new Promise(function(callback2) {
                    callback2(2)
                }))
            });

            a.subscribe(spy);

            assert(spy.calledWith(2))
        });
    });

    describe('then', function() {
        it('should transform data', function() {
            r1.then(function(a, next) {
                next(a + 1);
            }).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [2])
            });
        });

        it('should transform promise data', function() {
            r1.then(function(a, next) {
                next(new Promise(function(callback) {
                    callback(a + 1)
                }));
            }).subscribe(spy);

            assert(spy.calledWith(2))
        });

        it('transform return value like callback', function() {
            r1.then(function(a, next) {
                return a + 1;
            }).subscribe(spy);

            assert(spy.calledWith(2))
        })

        it('transform return promise like callback', function() {
            r1.then(function(a, next) {
                return [new Promise(function(callback) {
                    callback(a + 1)
                })];
            }).subscribe(spy);

            assert(spy.calledWith([2]))
        });

    })

    describe('when', function() {
        it('call without args should notify', function(done) {
            Promise.when().subscribe(function() {
                assert.equal(arguments.length, 0)
                assert.deepEqual(slice.call(arguments), []);
                done();
            });
        });

        it('call without empty array should notify', function(done) {
            Promise.when([]).subscribe(function() {
                assert.equal(arguments.length, 1)
                assert.deepEqual(slice.call(arguments), [[]]);
                done();
            });
        });

        it('notify for each promise', function() {
            Promise.when(a, new Promise(function(callback) {
                callback(1);
                setTimeout(function() {
                    callback(2)
                }, 100)
            })).subscribe(spy);

            assert(spy.calledWith(1,2,1));
            clock.tick(100);
            assert(spy.calledWith(1,2,2));
            clock.tick(100);
            assert.equal(spy.callCount, 2);
        });

         it('dispose', function() {
            var spy = sinon.spy();
            var dispose = Promise.when(a, new Promise(function(callback) {
                callback(1);
                setTimeout(function() {
                    callback(2)
                }, 100)
            })).subscribe(spy);

            assert(spy.calledWith(1,2,1));
            dispose();

            clock.tick(101);
            assert.equal(spy.callCount, 1);
        });


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


        it(' should be merged', function(done) {
            Promise.when([a, b]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [[1,2,3,4]])
                done();
            });
        });

        it(' should be merged', function(done) {
            Promise.when(a, [a, [a, b]]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,[1,2, [1,2,3,4]]])
                done();
            });
        });

        it('im should be accept', function(done) {
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