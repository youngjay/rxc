var PreservedSubscribable = require('./lib/preserved-subscribable');
var Mutable = require('./lib/mutable');
var _ = require('underscore');
var slice = [].slice;

var fromCallback = function(fn) {
    var subscribable = new PreservedSubscribable();
    fn(function() {
        subscribable._notify.apply(subscribable, arguments);
    });
    return subscribable;
};

var fromCall = function(method, args, target) {
    args = slice.call(args);
    return fromCallback(function(fn) {
        method.apply(target, args.concat(function(err) {
            if (err) {
                console.log(err);
            } else {            
                fn.apply(null, slice.call(arguments, 1));
            }
        }));
    });
};



module.exports = _.extend(PreservedSubscribable.merge, {
    fromCall: fromCall,
    fromCallback: fromCallback,
    mutable: function() {
        return new Mutable();
    }
});