var slice = [].slice;
var _ = require('underscore');
var Subscribable = require('./subscribable');
var notify = Subscribable.prototype._notify;
var subscribe = Subscribable.prototype.subscribe;

var PreservedSubscribable = Subscribable.extend({
    _notify: function() {
        if (!this._isChanged(this, arguments)) {
            return;
        }

        this._args = arguments;
        return notify.apply(this, arguments);
    },

    _isChanged: function(args) {
        if (!this._args) {
            return true;
        }

        if (this._args.length !== args.length) {
            return true;
        }

        var self = this;
        return !_.all(this._args, function(arg, i) {
            return self.compare(arg === args[i]);
        });
    },

    compare: function(a, b) {
        return a === b;
    },

    subscribe: function(fn) {
        if (this._args) {
            fn.apply(null, this._args);
        }
        return subscribe.call(this, fn);
    },

    computed: function(fn) {
        var subscribable = new PreservedSubscribable();
        this.subscribe(function() {
            fn.apply(null, slice.call(arguments).concat([function() {
                subscribable._notify.apply(subscribable, arguments);
            }]));
        });
        return subscribable;
    }
});

module.exports = PreservedSubscribable;