var PreservedSubscribable = require('./preserved-subscribable');
var Mutable = require('./mutable');
var _ = require('underscore');
var slice = [].slice;
var noop = function() {};

var merge = PreservedSubscribable.merge;

var then = function(fn) {
    return (new Mutable()).value().then(fn);
};

var fromNodeStyleMethod = function(method, args, target) {
    return then(function(fn) {
        method.apply(target, slice.call(args).concat(function(err) {
            if (err) {
                console.log(err);
            } else {            
                fn.apply(null, slice.call(arguments, 1));
            }
        }));
    });
};

var disposable = function(fn) {
    return function(subscriber) {
        var isDisposed = false;

        var dispose = fn(function() {
            if (!isDisposed) {
                subscriber.apply(null, arguments);
            }
        });

        return function() {
            if (!isDisposed) {
                isDisposed = true;
                if (_.isFunction(dispose)) {
                    dispose();
                }
            }           
        }
    }
};

var Observable = require('./class').extend(
    function(handle) {
        this._handle = disposable(handle);
    },
    {
        subscribe: function(subscriber) {
            return this._handle(subscriber || noop);
        },

        then: function(transformer) {
            var self = this;
            return new Observable(function(subscriber) {
                return self.subscribe(function() {
                    transformer.apply(null, slice.call(arguments).concat([subscriber]));
                });
            });
        }
    }
);

module.exports = _.extend(merge, {
    fromNodeStyleMethod: fromNodeStyleMethod,
    then: then,
    Observable: Observable,
    mutable: function() {
        return new Mutable();
    }
});