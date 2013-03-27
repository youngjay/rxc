var PreservedSubscribable = require('./lib/preserved-subscribable');
var Mutable = require('./lib/mutable');
var _ = require('underscore');
var slice = [].slice;


var fromCall = function(method, args) {
    var subscribable = new PreservedSubscribable();
    method.apply(null, args.concat(function(err) {
        if (err) {
            console.log(err);
        } else {            
            subscribable._notify.apply(subscribable, slice.call(arguments, 1));
        }
    }));
    return subscribable;
};

module.exports = _.extend(PreservedSubscribable.merge, {
    fromCall: fromCall,
    mutable: function() {
        return new Mutable();
    }
});