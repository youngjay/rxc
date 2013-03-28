var rfs = require('../fs');
var p = require('path');
var DIR = p.join(__dirname, '../');

var isJS = function(file) {
    return /\.js$/.test(file);
};

// 列出所有js文件
rfs.readdirRecursive(DIR).subscribe(function(files) {
    console.log(files.filter(function(file) {
        return isJS(file);
    }))
});

