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

    then: function(fn) {
        var subscribable = new PreservedSubscribable();
        this.subscribe(function() {
            var then = function() {
                mergeArray(arguments).subscribe(function(arr) {
                    subscribable._notify.apply(subscribable, arr);
                });            
            };

            var ret = fn.apply(null, slice.call(arguments).concat([then]));

            if (ret !== undefined) {
                then(ret);
            }
        });
        return subscribable;
    }
});

var mergeArray = function(deps) {
    var subscribable = new PreservedSubscribable();
    var results = new Array(deps.length);
    var isFull = false;

    var check = function() {
        if (isFull) {
            notify();
            return;
        }

        for (var i = 0; i < deps.length; i++) {
            if (!results[i]) {
                return;
            }
        }
        isFull = true;
        notify();
    };

    var notify = function() {        
        subscribable._notify(results.reduce(function(ret, args) {
            ret.push.apply(ret, args);
            return ret;
        }, []));
    };

    _.each(deps, function(dep, i) {
        if (_.isArray(dep)) {
            dep = mergeArray(dep);
        }

        if (dep.subscribe) {
            dep.subscribe(function() {
                results[i] = slice.call(arguments);
                check();        
            });
        } else {
            results[i] = [dep];
        }                
    });

    check();

    return subscribable;
};

PreservedSubscribable.merge = function() {
    return mergeArray(arguments).then(function(arr, callback) {
        callback.apply(null, arr);
    });
};

module.exports = PreservedSubscribable;