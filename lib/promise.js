var slice = [].slice;
var _ = require('underscore');
var Class = require('./class');
var Subscribable = require('./subscribable');

var noop = function() {};

var returnValueNeedToBeEvaluate = function(o) {
    return o !== undefined && !_.isFunction(o);
};

var PromiseInterFace = Subscribable.extend({
    subscribe: function(subscriber) {
        throw new Error('to be implemented')
    },

    thenCallback: function(transformer) {
        var self = this;
        return new Promise(function(subscriber) {
            // 在每次进入的时候，如果上次的返回值是function的话，
            // 则认为那是一个dispose，需要调用它做一个清理
            var subscriberDisposeHandler;

            var disposePreviousSubscriber = function() {
                if (_.isFunction(subscriberDisposeHandler)) {
                    subscriberDisposeHandler();
                }
            };

            var disposeCurrentSubscriber = self.subscribe(function() {
                disposePreviousSubscriber();
                subscriberDisposeHandler = null;
                var ret  = transformer(slice.call(arguments), subscriber);
                if (returnValueNeedToBeEvaluate(ret)) {
                    subscriber(ret);
                } else {
                    subscriberDisposeHandler = ret;
                }                
            });

            return function() {
                disposeCurrentSubscriber();
                disposePreviousSubscriber();
            }
        });
    },

    then: function(transformer) {
        return this.thenCallback(function(args, callback) {
            return transformer.apply(null, args.concat(callback));
        })
    },

    pick: function() {
        var keys = slice.call(arguments);
        return this.thenCallback(function(args, callback) {               
            callback.apply(null, args.map(function(o) {
                return _.pick.apply(_, [o].concat(keys));
            }))
        });
    },

    pluck: function(key) {
        return this.thenCallback(function(args, callback) {
            callback.apply(null, _.pluck(args, key));
        });
    },

    done: function() {
        return this.subscribe(noop);
    }
});

var Promise = PromiseInterFace.extend(
    function(handle) {
        this.subscribe = function(subscriber) {
            var isDisposed = false;

            var prevArgsDisposeHandler;

            var disposePrevArgs = function() {
                if (prevArgsDisposeHandler) {
                    prevArgsDisposeHandler();
                }
            };

            var evaluateArgs = function() {
                if (!isDisposed) {
                    disposePrevArgs();
                    prevArgsDisposeHandler = whenAllSubscribablesAreNotified(arguments).subscribe(function(args) {
                        subscriber.apply(null, args);
                    });     
                }                  
            };

            var dispose = handle(evaluateArgs);
            
            // if return something that was not a dispose            
            if (returnValueNeedToBeEvaluate(dispose)) {
                evaluateArgs(dispose);
            }

            return function() {
                if (!isDisposed) {
                    isDisposed = true;    
                    disposePrevArgs();       
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
        this.subscribe = function(subscriber) {
            subscriber.apply(null, args);
            return noop;
        }
    }
);

var containSubscribable = function(o) {
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

    if (!containSubscribable(subscribables)) {
        return new ReturnObjectPromise(subscribables);
    }

    return new Promise(function(callback) {
        var results = new Array(subscribables.length);

        var check = creatCheck(results, callback);

        var disposes = checkEachSubscribables(subscribables, check);        

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
                    disposes.push()
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

var never = new Promise(noop);

var aggregate = {
    wrap: function() {
        var proto = Object.create(ReturnObjectPromise.prototype);        
        ReturnObjectPromise.apply(proto, arguments);
        return proto;
    },

    then: function(fn) {
        return new Promise(fn);
    },
    
    when: function(singleSubscribable) {
        // shortcut for single subscribable
        if (arguments.length === 1 && !_.isArray(singleSubscribable)) {
            return new Promise(function(callback) {
                return singleSubscribable.subscribe(callback);
            })
        }

        return whenAllSubscribablesAreNotified(arguments).then(function(arr, callback) {
            callback.apply(null, arr);
        });
    },

    any: function() {
        var subscribables = arguments;
        if (subscribables.length === 0) {
            return never;
        }

        if (subscribables.length === 1) {
            return subscribables[0];
        }

        return new Promise(function(callback) {
            var disposes = _.map(subscribables, function(subscribable) {
                return subscribable.subscribe(callback);
            });
            return function() {
                _.each(disposes, function(dispose) {
                    dispose();
                });
            }
        });
    }
};


module.exports = _.extend({
    PromiseInterFace: PromiseInterFace,
    Promise: Promise    
}, aggregate);