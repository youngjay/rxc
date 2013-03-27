var PreservedSubscribable = require('./lib/preserved-subscribable');
var _ = require('underscore');
var fs = require('fs');
var slice = [].slice;

var Mutable = PreservedSubscribable.extend(
    function() {
        if (arguments.length) {
            this.value.apply(this, arguments);
        }
    },
    {
        value: function() {
            this._notify.apply(this, arguments);
        }
    }
);

var mergeArray = function(deps) {
    var subscribable = new PreservedSubscribable();
    var results = new Array(deps.length);

    var check = function() {
        for (var i = 0; i < deps.length; i++) {
            if (!results[i]) {
                return;
            }
        }
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
            check();
        }                
    });

    return subscribable;
};

var merge = function() {
    return mergeArray(arguments).computed(function(arr, callback) {
        callback.apply(null, arr);
    });
};

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

_.extend(exports, {
    merge: merge,
    fromCall: fromCall,
    mutable: function() {
        return new Mutable();
    }
});

// var file = exports.fromCall(fs.readFile, ['./index.js', 'utf8']);
// var file1 = exports.fromCall(fs.readFile, ['./lib/class.js', 'utf8']);


// merge([file, file1]).computed(function(arr, callback) {
//     callback(arr.length);
// }).subscribe(function(a) {
//     console.log(a)
// });

var a = new Mutable();
var b = new Mutable();

a.value('a');
b.value('b');


var c = merge(a, 10)

// var d = merge(c, [c, [c]])

c.subscribe(function() {
    console.log(JSON.stringify(slice.call(arguments)));
});

// a.value('a');
a.value('a', 'b');


// a.notify(111);
// b.notify(2);