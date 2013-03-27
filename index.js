var DependentSubscribable = require('./lib/dependent-subscribable');
var Mutable = require('./lib/mutable');
var _ = require('underscore');
var fs = require('fs');
var slice = [].slice;

var computed = function() {
    return (new DependentSubscribable(slice.call(arguments, 0, arguments.length - 1))).computed(arguments[arguments.length - 1]);
};

var fromCall = function(method, args) {
    return computed(function(fn) {
        return method.apply(null, args.concat(function(err) {
            if (err) {
                console.log(err);
                return;
            } else {
                fn.apply(null, slice.call(arguments, 1));
            }
        }));
    });
};

_.extend(exports, {
    computed: computed,
    fromCall: fromCall,
    Mutable: Mutable
});


var file = exports.fromCall(fs.readFile, ['./index.js', 'utf8']);
var file1 = exports.fromCall(fs.readFile, ['./lib/class.js', 'utf8']);


computed(file, file1, function(file, file1, callback) {
    callback(file + '\n' + file1);
}).subscribe(function(a) {
    console.log(a)
});


// var a = new Mutable();
// var b = new Mutable();

// a.notify(1);
// b.notify(1);


// var c = computed(a, 10, function(_a, _b, callback) {
//     callback(_a + _b);
// });

// c.subscribe(function() {
//     console.log(arguments);
// });



// a.notify(111);
// b.notify(2);