var PreservedSubscribable = require('./preserved-subscribable');
var Mutable = require('./mutable');
var _ = require('underscore');
var slice = [].slice;

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

module.exports = _.extend(merge, {
    fromNodeStyleMethod: fromNodeStyleMethod,
    then: then,
    mutable: function() {
        return new Mutable();
    }
});