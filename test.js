var rx = require('./index')
var fs = require('fs');
var slice = [].slice;

// var file = exports.fromCall(fs.readFile, ['./index.js', 'utf8']);
// var file1 = exports.fromCall(fs.readFile, ['./lib/class.js', 'utf8']);


// merge([file, file1]).computed(function(arr, callback) {
//     callback(arr.length);
// }).subscribe(function(a) {
//     console.log(a)
// });

var a = new rx.mutable();
var b = new rx.mutable();

a.value('a');
b.value('b');


var c = rx(a, 10)

// var c = rx().subscribe(function() {
//     console.log(arguments)
// })



// var d = merge(c, [c, [c]])

c.computed(function(a, b, callback) {
    callback(rx(a, b))
}).subscribe(function() {
    console.log(JSON.stringify(slice.call(arguments)));
});

// a.value('a');
// a.value('a', 'b');


// a.notify(111);
// b.notify(2);