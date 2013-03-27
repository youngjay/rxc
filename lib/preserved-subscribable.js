var Subscribable = require('./subscribable');
var notify = Subscribable.prototype._notify;
var subscribe = Subscribable.prototype.subscribe;

module.exports = Subscribable.extend({
    _notify: function() {
        this._args = arguments;
        return notify.apply(this, arguments);
    },

    subscribe: function(fn) {
        if (this._args) {
            fn.apply(null, this._args);
        }
        return subscribe.call(this, fn);
    }
});