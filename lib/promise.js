var PreservedEvent = require('../lib/preserved-event');
var slice = [].slice;
var _ = require('underscore');
var Class = require('./class');
var Subscribable = require('./subscribable');

var noop = function() {};

var PromiseInterFace = Subscribable.extend({
        _handle: function(subscriber) {
            throw new Error('to be implemented')
        },

        subscribe: function(subscriber) {
            return this._handle(subscriber || noop);
        },

        then: function(transformer) {
            var self = this;
            return new Promise(function(subscriber) {
                return self.subscribe(function() {
                    var ret = transformer.apply(null, slice.call(arguments).concat([subscriber]));
                    if (ret !== undefined) {
                        subscriber(ret);
                    }
                });
            });
        }
    })
    .mixStatic({
        when: function() {
            return whenAllSubscribablesAreNotified(arguments).then(function(arr, callback) {
                callback.apply(null, arr);
            });
        }
    })

var Promise = PromiseInterFace.extend(
    function(handle) {
        this._handle = function(subscriber) {
            var isDisposed = false;

            var dispose = handle(function() {
                if (!isDisposed) {
                    whenAllSubscribablesAreNotified(arguments).subscribe(function(arr) {
                        subscriber.apply(null, arr);
                    }); 
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
    }
);

var ReturnObjectPromise = PromiseInterFace.extend(
    function() {
        var args = arguments;
        this._handle = function(subscriber) {
            subscriber.apply(null, args);
            return noop;
        }
    }
);

var containsSubscribable = function(o) {
    if (!o) {
        return false;
    }

    if (Subscribable.test(o)) {
        return true;
    }

    if (typeof o === 'object' && typeof o.length === 'number') {
        return _.some(o, arguments.callee);
    }

    return false;
};

var whenAllSubscribablesAreNotified = function(subscribables) {

    subscribables = slice.call(subscribables);

    return containsSubscribable(subscribables) ? new Promise(function(callback) {
            var results = new Array(subscribables.length);

            var check = creatCheck(results, callback);

            var disposes = checkEachSubscribables(subscribables, check);        

            return function() {
                disposes.forEach(function(dispose) {
                    dispose();
                });
            }
        }) : 
        new ReturnObjectPromise(subscribables);
    ;
};

var creatCheck = function(results, callback) {
    var isFull = false;

    var notify = function() {   
        callback(results.reduce(function(ret, args) {
            return ret.concat(args);
        }, []));
    };

    return results.length ? 
        function(resultsIndex, args) {
            results[resultsIndex] = args;

            if (isFull) {
                notify();
                return;
            }

            for (var i = 0; i < results.length; i++) {
                if (!results[i]) {
                    return;
                }
            }

            isFull = true;
            notify();
        } :
        notify
    ;
};

var checkEachSubscribables = function(subscribables, check) {
    var disposes = [];
    if (subscribables.length) {
        _.each(subscribables, function(dep, i) {
            if (_.isArray(dep)) {
                dep = whenAllSubscribablesAreNotified(dep);
            }

            if (Subscribable.test(dep)) {
                disposes.push(dep.subscribe(function() {
                    check(i, slice.call(arguments));        
                }));
            } else {
                check(i, [dep]);
            }                
        });
    } else {
        check();
    }

    return disposes;        
};

module.exports = Promise;