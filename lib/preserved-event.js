var Event = require('./event');
var notify = Event.prototype.notify;
var subscribe = Event.prototype.subscribe;

module.exports = Event.extend({
    notify: function() {
        this._lastArgs = arguments;
        return notify.apply(this, arguments);
    },

    subscribe: function(fn) {
        var dispose = subscribe.apply(this, arguments);
        if (this._lastArgs) {
            fn.apply(null, this._lastArgs);
        }
        return dispose;
    }
});