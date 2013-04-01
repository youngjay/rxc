var assert = require("assert")
var slice = [].slice;
var rx = require('../index');


describe('rx', function() {
    describe('#mutable()', function() {
        var mu;

        beforeEach(function() {
            mu = rx.mutable();
        });

        it('mutable should be subscribable', function() {
            assert.equal(typeof mu.subscribe, 'function')
        })


        it('value before subscribe should be receive by subscribe', function(done) {
            mu.value(1, 2);
            mu.subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1, 2]);
                done();
            })
        });

        it('value after subscribe should be receive by subscribe', function(done) {
            
            mu.subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1, 2]);
                done();
            })
            mu.value(1, 2);
        });
    });

    describe('#()', function() {
        var a, b;

        beforeEach(function() {
            a = rx.mutable();
            b = rx.mutable();

            a.value(1, 2);
            b.value(3, 4);
        })

        it('mutable should be merged', function(done) {    
            rx(a, b).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,3,4])
                done();
            });
        });

        it('mutable should be merged', function(done) {
            rx([a, b]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [[1,2,3,4]])
                done();
            });
        });

        it('mutable should be merged', function(done) {
            rx(a, [a, [a, b]]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,[1,2, [1,2,3,4]]])
                done();
            });
        });

        it('immutable should be accept', function(done) {
            rx(a, [a, [a, b, 10], 10]).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1,2,[1,2, [1,2,3,4, 10], 10]])
                done();
            });
        });

        it('nested rx should be accept', function(done) {
            var c = rx(a, b);
            var d = rx([a], c);

            d.subscribe(function() {
                assert.deepEqual(slice.call(arguments), [[1,2], 1,2,3,4])
                done();
            });
        })

    });

    describe('rx.then', function() {
        it('should be subscribed', function(done) {
            rx.then(function() {
                return 1;
            }).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1]);
                done();
            })
        });


        it('should be subscribed', function(done) {
            rx.then(function(callback) {
                return callback(1, 2);
            }).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [1, 2]);
                done();
            })
        });
    });

    describe('#then', function() {
        var a, b;

        beforeEach(function() {
            a = rx.mutable();
            b = rx.mutable();

            a.value(1, 2);
            b.value(3, 4);
        })


        it('then args should be right', function(done) {
            a.then(function() {
                assert.equal(arguments.length, 3)
                assert.deepEqual(slice.call(arguments, 0, arguments.length - 1), [1,2]);
                assert.equal(typeof arguments[arguments.length - 1], 'function');
                done();
            });
        });

        it('then args should be right', function(done) {
            rx(a, b).then(function() {
                assert.equal(arguments.length, 5)
                assert.deepEqual(slice.call(arguments, 0, arguments.length - 1), [1,2,3,4]);
                assert.equal(typeof arguments[arguments.length - 1], 'function');
                done();
            });
        });

        it('then args should be right', function(done) {
            rx([a, b]).then(function() {
                assert.equal(arguments.length, 2)
                assert.deepEqual(slice.call(arguments, 0, arguments.length - 1), [[1,2,3,4]]);
                assert.equal(typeof arguments[arguments.length - 1], 'function');
                done();
            });
        });


        it('then should pass right value', function(done) {
            a.then(function(j, k, fn) {
                fn(k, j);
            }).subscribe(function() {
                assert.equal(arguments.length, 2)
                assert.deepEqual(slice.call(arguments), [2, 1])
                done();
            });
        })

        it('then should pass right value', function(done) {
            a.then(function(j, k, fn) {
                fn([k, j]);
            }).subscribe(function() {
                assert.equal(arguments.length, 1)
                assert.deepEqual(slice.call(arguments), [[2, 1]])
                done();
            });
        })

        it('then auto proccess rx', function(done) {
            a.then(function(j, k, fn) {
                var c = rx.mutable();
                fn(c);
                setTimeout(function() {
                    c.value(k, j)
                }, 40);
            }).subscribe(function() {
                assert.equal(arguments.length, 2)
                assert.deepEqual(slice.call(arguments), [2, 1])
                done();
            });
        });
    });
});