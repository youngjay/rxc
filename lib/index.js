var Promise = require('./promise');
var PreservedEvent = require('./preserved-event')
var Event = require('./event');

module.exports = {
    createEvent: function() {
        return new Event();
    },

    createPreservedEvent: function() {
        return new PreservedEvent();
    },

    then: function(fn) {
        return new Promise(fn);
    },

    when: function() {
        return Promise.when.apply(Promise, arguments);
    },

    any: function() {
        return Promise.any.apply(Promise, arguments);
    },

    _drivenBy: function(dispatcher, target) {
        var notify = dispatcher.notify;
        target.subscribe(function() {
            notify.apply(dispatcher, arguments);
        });
        return this.when(dispatcher);
    },

    preservedBy: function(subscribable) {
        return this._drivenBy(new PreservedEvent(), subscribable);
    },

    notifiedBy: function(subscribable) {
        return this._drivenBy(new Event(), subscribable);
    }
};