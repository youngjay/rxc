var assert = require("assert")
var slice = [].slice;
var rx = require('../index');
var sinon = require('sinon');
var Class = require('../lib/class')
var Event = rx.Event;

var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);
var expect = chai.expect;

describe('rx', function() {

    var clock;
    var spy;

    before(function () { clock = sinon.useFakeTimers(); });
    after(function () { clock.restore(); });


    beforeEach(function() {
        spy = sinon.spy();
        
    })

    describe('rx', function() {
        var Model = Class.extend(
            function() {
                var self = this;

                this.loadEvent = rx.createPreservedEvent();
                this.idEditEvent = rx.createPreservedEvent();


                this.idChangeEvent = rx.when(this.idEditEvent).then(function(evt, callback) {
                    return evt.subscribe(callback);
                });


                this.loadF = rx.any(
                    this.idChangeEvent.then(function(id, callback) {
                        callback({
                            id: id
                        })
                    }),
                    rx.when(this.loadEvent).then(function(evt, callback) {
                        return evt.subscribe(callback);
                    })
                );

                this.remoteData = rx.preservedBy(this.loadF.then(function(query, callback) {
                    return self.request(query, callback);
                }));

                this.data = this.remoteData.then(function(remoteData, callback) {
                    if (remoteData.code === 200) {
                        callback(remoteData.msg);
                    }
                });

                this.error = this.remoteData.then(function(remoteData, callback) {
                    if (remoteData.code === 500) {
                        callback(remoteData.msg);
                    }
                })

                this.id = rx.any(
                    this.idChangeEvent,
                    this.data.pluck('id')
                )
            },
            {
                setLoadEvent: function(evt) {
                    this.loadEvent.notify(evt);
                },

                setIdEditor: function(evt) {
                    this.idEditEvent.notify(evt);
                },

                request: function(query, callback) {      
                    callback({
                        code: 200,
                        msg: query
                    })
                }
            }
        )
    
        var m, load;
        beforeEach(function() {
            m = new Model;
            load = rx.createEvent();

            m.setLoadEvent(load);
        })

        it('should set name', function() {
            

            m.request = function(query, callback) {
                spy();
                setTimeout(function() {
                    callback({
                        code: 200,
                        msg: query
                    })
                }, 100)
            };

            load.notify({
                id: 0
            });

            expect(spy).be.calledOnce;

            load.notify({
                id: 1
            });


            expect(spy).be.calledTwice;

            spy.reset();
            m.id.subscribe(spy)
            expect(spy).not.to.be.called;

            clock.tick(100);
            expect(spy).be.calledWith(1);



            spy.reset();
            load.notify({
                id: 2
            });
            clock.tick(100);
            expect(spy).be.calledWith(2);
        });


        it('should report error', function() {
            m.request = function(query, callback) {
                callback({
                    code: 500,
                    msg: 'error'
                })
            };

            load.notify({
                id: 2
            });

            m.id.subscribe(spy);

            expect(spy).not.to.be.called

            spy.reset();
            m.error.subscribe(spy);
            expect(spy).to.be.calledWith('error')
        })


        it('id can changed by both remote and dom event', function() {

            m.id.subscribe(spy);

            load.notify({
                id: 0
            });

            expect(spy).to.be.calledWith(0);

            var idEditEvent = rx.createEvent();

            m.setIdEditor(idEditEvent);

            idEditEvent.notify(10);

            expect(spy).to.be.calledWith(10);


        })
    })





});