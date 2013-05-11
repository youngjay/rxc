var PreservedEvent = require('../lib/preserved-event');
var slice = [].slice;
var _ = require('underscore');

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

var Promise = require('./class')
    .extend(
        function(handle) {
            this._handle = disposable(handle);
        },
        {
            subscribe: function(subscriber) {
                return this._handle(subscriber || noop);
            },

            then: function(transformer) {
                var self = this;
                return new Promise(function(subscriber) {
                    return self.subscribe(function() {
                        transformer.apply(null, slice.call(arguments).concat([subscriber]));
                    });
                });
            }
        }
    )
    .mixStatic({
        when: function() {
            return mergePromises(arguments).then(function(arr, callback) {
                callback.apply(null, arr);
            });
        }
    })


var mergePromises = function(promises) {
    promises = slice.call(promises);

    return new Promise(function(callback) {
        var results = new Array(promises.length);

        var check = creatCheck(results, callback);

        var disposes = subscribePromises(promises, check);        

        return function() {
            disposes.forEach(function(dispose) {
                dispose();
            });
        }
    });
};

var creatCheck = function(results, callback) {
    var isFull = false;

    var notify = function() {   
        callback(results.reduce(function(ret, args) {
            return ret.concat(args);
        }, []));
    };

    return function(resultsIndex, args) {
        if (!results.length) {
            notify();
        }

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
    };
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