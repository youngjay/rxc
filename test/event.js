var Event = require('../lib/event');
var sinon = require('sinon');
var assert = require('assert');


describe('event', function() {
    var ev, spy;

    beforeEach(function() {
        ev = new Event();
        spy = sinon.spy();
    })

    describe('#notify()', function() {

        it('should notify subscriber', function() {
            ev.subscribe(spy);
            ev.notify(1, 2);
            assert(spy.calledWith(1, 2), true);


            ev.notify(2, 2);
            assert(spy.calledWith(2, 2), true);

        })

    });


    describe('dispose', function() {
        it('should not call subscriber after dispose', function() {
            var dispose = ev.subscribe(spy);
            dispose();
            ev.notify(1, 2);
            assert.equal(spy.callCount, 0);
        })
    });
});