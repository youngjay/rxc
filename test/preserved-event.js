var PreservedEvent = require('../lib/preserved-event');
var sinon = require('sinon');
var assert = require('assert');


describe('preserved-event', function() {
    var ev, spy;

    beforeEach(function() {
        ev = new PreservedEvent();
        spy = sinon.spy();
    })

    describe('#notify()', function() {

        it('subscriber should be notify for last notify action', function() {
            ev.notify(1, 2);
            ev.subscribe(spy);
            assert(spy.calledWith(1, 2), true);


            ev.notify(2, 2);
            assert(spy.calledWith(2, 2), true);

        })

    });


    describe('dispose', function() {
        it('should not call subscriber after dispose', function() {            
            ev.notify(1, 2);
            var dispose = ev.subscribe(spy);
            assert(spy.calledWith(1, 2), true);
            dispose();

            // not affect
            ev.notify(2, 2);
            assert(spy.calledWith(1, 2), true);
        })
    });
});