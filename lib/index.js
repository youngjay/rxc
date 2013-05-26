var promise = require('./promise');
var Promise = promise.Promise;
var PromiseInterFace = promise.PromiseInterFace;

var PreservedEvent = require('./preserved-event')
var Event = require('./event');

var enhanceEvent = function(Klass) {
    var eventSubscribe = Klass.prototype.subscribe;
    return Klass.extend(
        PromiseInterFace,
        function() {
            var self = this;
            this.promise = new Promise(function(subscriber) {
                return eventSubscribe.call(self, subscriber);
            });
        },
        {
            subscribe: function(subscriber) {
                return this.promise.subscribe(subscriber);
            }
        }
    );
};

var EnhancedEvent = enhanceEvent(Event);
var EnhancedPreservedEvent = enhanceEvent(PreservedEvent);
var EventEvent = EnhancedPreservedEvent.extend({
    resolveEvent: function() {
        return this.then(function(evt, callback) {
            return evt.subscribe(callback);
        });
    },

    replaceEvent: function(evt) {
        return this.notify(evt);
    }
});

module.exports = {
    createEvent: function() {
        return new EnhancedEvent();
    },

    createPreservedEvent: function() {
        return new EnhancedPreservedEvent();
    },

    createEventEvent: function() {
        return new EventEvent();
    },

    then: function(fn) {
        return new Promise(fn);
    },

    when: promise.when,

    any: promise.any,

    preserve: function(target) {
        var subscribersHolder = this.createPreservedEvent();
        var notify = subscribersHolder.notify;
        target.subscribe(function() {
            notify.apply(subscribersHolder, arguments);
        });
        return subscribersHolder;
    }
};