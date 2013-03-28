var fs = require('fs');
var _ = require('underscore');
var rx = require('./index');
var p = require('path');

var returnTrue = function() {return true};

var isHidden = function(file) {
    return /(?:^|\/)\.\w+/.test(file);
};

var readdirRecursiveDefaultOptions = {
    skipHidden: true
};

var rfs = module.exports = {
    readdirRecursive: function(dir, options) {
        options = _.defaults(options || {}, readdirRecursiveDefaultOptions);

        var process = function(curDir) {
            return rfs.readdir(curDir)
                .computed(function(paths, callback) {
                    callback(paths.map(function(path) {
                        return rfs.stat(p.join(curDir, path));
                    }), paths);
                })
                .computed(function(fileStats, paths, callback) {
                    var dirs = [], files = [];
                    fileStats.forEach(function(stats, i) {
                        var path = p.join(curDir, paths[i]);  

                        if (options.skipHidden && isHidden(path)) {
                            return;
                        }

                        if (stats.isDirectory()) {
                            dirs.push(process(path));
                        } else {
                            files.push(path);
                        }
                    });
                    dirs.push(files);
                    callback(dirs);
                })
                .computed(function(filesInDirs, callback) {
                    callback(filesInDirs.reduce(function(all, filesInDir) {
                        return all.concat(filesInDir)
                    }, []));
                });
        };
        
        return process(dir);
    }
};


_.each(fs, function(fn, key) {
    if (!/Sync$/.test(key)) {
        rfs[key] = function() {
            return rx.fromCall(fn, arguments);
        };
    }
});
