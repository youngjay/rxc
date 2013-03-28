var rfs = require('../fs');
var p = require('path');
var DIR = p.join(__dirname, '../');

rfs.readdirr(DIR).subscribe(function(files) {
    console.log(files.filter(function(file) {
        return /\.js$/.test(file);
    }))
});

