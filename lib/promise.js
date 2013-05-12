var PreservedEvent = require('../lib/preserved-event');
var slice = [].slice;
var _ = require('underscore');

var noop = function() {};

var PromiseInterFace = require('./class').extend({
        _handle: function(callback) {
            throw new Error('must implement _handle')
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
            return mergePromises(arguments).then(function(arr, callback) {
                callback.apply(null, arr);
            });
        }
    })


var evaluatePromiseInArgs = function(args, subscriber) {
     mergePromises(args).subscribe(function(arr) {
        subscriber.apply(null, arr);
    });  
};

var Promise = PromiseInterFace
    .extend(
        function(handle) {
            this._handle = function(subscriber) {
                var isDisposed = false;

                var dispose = handle(function() {
                    if (!isDisposed) {
                        evaluatePromiseInArgs(arguments, subscriber);
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
    )

var ReturnObjectPromise = PromiseInterFace.extend(
    function() {
        var args = arguments;
        this._handle = function(callback) {
            callback.apply(null, args);
            return noop;
        }
    }
);

var containsPromise = function(o) {
    if (!o) {
        return false;
    }

    if (o.subscribe) {
        return true;
    }

    if (typeof o === 'object' && typeof o.length === 'number') {
        return _.some(o, arguments.callee);
    }

    return false;
};

var mergePromises = function(promises) {

    promises = slice.call(promises);

    return containsPromise(promises) ? new Promise(function(callback) {
            var results = new Array(promises.length);

            var check = creatCheck(results, callback);

            var disposes = subscribePromises(promises, check);        

            return function() {
                disposes.forEach(function(dispose) {
                    dispose();
                });
            }
        }) : 
        new ReturnObjectPromise(promises);
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

var subscribePromises = function(promises, check) {
    var disposes = [];
    if (promises.length) {
        _.each(promises, function(dep, i) {
            if (_.isArray(dep)) {
                dep = mergePromises(dep);
            }

            if (dep.subscribe) {
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