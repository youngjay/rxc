var p = require('path');
var rfs = require('../node/fs');
var src = p.join(__dirname, '../lib');
var dist = p.join(__dirname, '../lib-cmd');


var wrapCMD = function(str) {
    return 'define(function(require, exports, module) {\n\n    ' + str.replace(/(\n)/g, '$1    ') + '\n})';
};

rfs.rmr(dist)
    .then(function(callback) {
        callback(rfs.mkdir(dist));
    })
    .then(function(callback) {
        callback(rfs.readdirr(src));
    })
    .then(function(files, callback) {
        callback(
            files.map(function(file) {
                return file.substring(file.lastIndexOf(p.sep) + 1);
            }),
            files.map(function(file) {
                return rfs.readFile(file, 'utf8');
            })
        )
    })
    .then(function(fileNames, contents, callback) {
        callback(contents.map(function(content, i) {
            return rfs.writeFile(p.join(dist, fileNames[i]), wrapCMD(content), 'utf8');
        }));
    })
    .subscribe(function() {
        console.log('files build in:' + dist)
    })