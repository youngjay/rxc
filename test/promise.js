var Promise = require('../lib/promise');
var sinon = require('sinon');
var assert = require('assert');
var slice = [].slice;
var Event = require('../lib/event');

var Class = require('../lib/class');
var PreservedEvent = require('../lib/preserved-event');
var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);
var expect = chai.expect;

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


    // describe('::new', function() {
    //     it('evaluate promise', function() {
    //         var a = new Promise(function(callback) {
    //             callback(new Promise(function(callback2) {
    //                 callback2(2)
    //             }))
    //         });

    //         a.subscribe(spy);

    //         assert(spy.calledWith(2))
    //     });
    // });

    describe('#then', function() {
        it('should transform data', function() {
            r1.then(function(a, next) {
                next(a + 1);
            }).subscribe(function() {
                assert.deepEqual(slice.call(arguments), [2])
            });
        });

        // it('should transform promise data', function() {
        //     r1.then(function(a, next) {
        //         next(new Promise(function(callback) {
        //             callback(a + 1)
        //         }));
        //     }).subscribe(spy);

        //     assert(spy.calledWith(2))
        // });




        it('should call previous return  function when called', function() {
            var host = new Event();


            var p = new Promise(function(callback) {
                return host.subscribe(callback);
            });

            p.then(function(a) {
                return spy
            }).done();


            expect(spy).not.be.called;

            host.notify(1)
            host.notify(2)

            expect(spy).be.called;

        })

        it('should invoke return function when dispose is called', function() {
            (r1.then(function() {
                return spy
            }).done())()


            expect(spy).be.called;
        })


        // it('should dispose previous when next is attached', function() {
        //     var e1 = new Event();
        //     var e2 = new Event();
        //     var host = new Event();


        //     var p = new Promise(function(callback) {
        //         return host.subscribe(callback);
        //     });

        //     // p.then(function(evt) {
        //     //     return evt.subscribe(spy);
        //     // }).done();

        //     p.then(spy).done()

        //     host.notify(e1);
        //     e1.notify('e1');
        //     expect(spy).calledWith('e1')


        //     spy.reset();
        //     host.notify(e2);
        //     e2.notify('e2');
        //     expect(spy).calledWith('e2')


        //     spy.reset();
        //     e1.notify('e1');
        //     expect(spy).not.to.be.called;


        //     spy.reset();
        //     e2.notify('e2');
        //     expect(spy).calledWith('e2')

        // })

        it('should dispose for return dipose', function() {
            r1.then(function(n, callback) {
                
            })
        })


        // it('transform return promise like callback', function() {
        //     r1.then(function(a, next) {
        //         return [new Promise(function(callback) {
        //             callback(a + 1)
        //         })];
        //     }).subscribe(spy);

        //     assert(spy.calledWith([2]))
        // });

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


    describe('#dispose', function() {
        it('should call handle return function', function() {

            (new Promise(function() {
                return spy
            }).done())()

            expect(spy).be.called;

        })
        
    })

    describe('pick', function() {

        it('skip empty', function() {
            var p = new Promise(function(callback) {
                callback();
            })

            p.pick('a').subscribe(spy);

            expect(spy).to.be.calledWithExactly();
        })

        it('pick all', function() {
            var p = new Promise(function(callback) {
                callback({
                    a: 1,
                    b: 2
                }, {
                    a: 10,
                    b: 20
                });
            })

            p.pick('a').subscribe(spy);

            expect(spy).to.be.calledWithExactly({a: 1}, {a: 10});
        })
    })

     describe('pluck', function() {

        it('skip empty', function() {
            var p = new Promise(function(callback) {
                callback();
            })

            p.pluck('a').subscribe(spy);

            expect(spy).to.be.calledWithExactly();
        })

        it('pluck all', function() {
            var p = new Promise(function(callback) {
                callback({
                    a: 1,
                    b: 2
                }, {
                    a: 10,
                    b: 20
                });
            })

            p.pluck('a').subscribe(spy);

            expect(spy).to.be.calledWithExactly(1, 10);
        })
    })


})