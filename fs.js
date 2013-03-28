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

var readdirr = function(dir, options) {
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
};

var rmr = function(path) {
    
    var process = function(curPath) {  
        return rfs.stat(curPath).computed(function(stats, callback) {
            if (stats.isDirectory()) {
                callback(rmdir(curPath));
            } else {
                callback(rfs.unlink(curPath));
            }
        })
    };

    var rmdir = function(curPath) {
        return rfs.readdir(curPath).computed(function(subPaths, callback) {
            rx(subPaths.map(function(subPath) {
                return process(p.join(curPath, subPath))
            })).subscribe(function() {
                rfs.rmdir(curPath).subscribe(callback)
            });
        });
    };

    return rfs.exists(path).computed(function(exists, callback) {
        if (exists) {
            callback(process(path))
        } else {
            callback();
        }
    });
};

var cpr = function(src, dist) {
    return rmr(dist)
        .computed(function() {
            return rfs.stat(src)
        })
        .computed(function(stat) {
            return rfs.mkdir(dist, stat.mode);
        })
        .computed(function() {
            return rfs.readdir(src)
        })
        .computed(function(paths, callback) {
            callback(
                paths.map(function(path) {
                    return rfs.stat(p.join(src, path));
                }),
                paths
            ) 
        })
        .computed(function(stats, paths) {
            return stats.map(function(stat, i) {
                var srcPath = p.join(src, paths[i]);
                var distPath = p.join(dist, paths[i]);

                if (stat.isDirectory()) {
                    return cpr(srcPath, distPath);
                }

                if (stat.isSymbolicLink()) {
                    return rfs.readlink(srcPath).computed(function(link){
                        return rfs.symlink(link, distPath);
                    });
                }

                return rfs.readFile(srcPath).computed(function(content) {
                    return rfs.writeFile(distPath, content);
                })
            });
        })
};

var rfs = module.exports = {
    readdirr: readdirr,
    rmr: rmr,
    cpr: cpr
};

_.each(fs, function(fn, key) {
    if (!/Sync$/.test(key)) {
        rfs[key] = function() {
            return rx.fromNodeStyleMethod(fn, arguments);
        };
    }
});

_.extend(rfs, {
    // `exists` has no err argument
    exists: function(path) {
        return rx.fromCallback(function(fn) {
            fs.exists(path, fn);
        });
    }
})
