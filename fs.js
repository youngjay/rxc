var fs = require('fs');
var _ = require('underscore');
var rx = require('./index');
var p = require('path');

var returnTrue = function() {return true};

var isHidden = function(file) {
    return /(?:^|\/)\.\w+/.test(file);
};

var readdirrDefaultOptions = {
    hidden: false,
    directory: false
};

var readdirr = function(dir, options) {
    options = _.defaults(options || {}, readdirrDefaultOptions);

    var process = function(curDir) {
        return rfs.readdir(curDir)
            .then(function(paths, callback) {
                callback(paths.map(function(path) {
                    return rfs.stat(p.join(curDir, path));
                }), paths);
            })
            .then(function(fileStats, paths) {
                var dirs = [], files = [];
                fileStats.forEach(function(stats, i) {
                    var path = p.join(curDir, paths[i]);  

                    if (isHidden(path) && !options.hidden) {
                        return;
                    }

                    if (stats.isDirectory()) {
                        dirs.push(process(path));

                        if (options.directory) {
                            files.push(path);
                        }
                    } else {
                        files.push(path);
                    }
                });

                dirs.push(files);
                
                return dirs;
            })
            .then(function(filesInDirs) {
                return filesInDirs.reduce(function(all, filesInDir) {
                    return all.concat(filesInDir)
                }, []);
            });
    };
    
    return process(dir);
};

var rmr = function(path) {
    
    var process = function(curPath) {  
        return rfs.stat(curPath).then(function(stats) {
            return stats.isDirectory() ? rmdir(curPath) : rfs.unlink(curPath)
        });
    };

    var rmdir = function(curPath) {
        return rfs.readdir(curPath)
            .then(function(subPaths) {
                return subPaths.map(function(subPath) {
                    return process(p.join(curPath, subPath))
                })
            })
            .then(function() {
                return rfs.rmdir(curPath)
            })
    };

    return rfs.exists(path).then(function(exists, callback) {
        if (exists) {
            callback(process(path))
        } else {
            callback();
        }
    });
};

var cpr = function(src, dist) {
    return rmr(dist)
        .then(function() {
            return rfs.stat(src)
        })
        .then(function(stat) {
            return rfs.mkdir(dist, stat.mode);
        })
        .then(function() {
            return rfs.readdir(src)
        })
        .then(function(paths, callback) {
            callback(
                paths.map(function(path) {
                    return rfs.stat(p.join(src, path));
                }),
                paths
            ) 
        })
        .then(function(stats, paths) {
            return stats.map(function(stat, i) {
                var srcPath = p.join(src, paths[i]);
                var distPath = p.join(dist, paths[i]);

                if (stat.isDirectory()) {
                    return cpr(srcPath, distPath);
                }

                if (stat.isSymbolicLink()) {
                    return rfs.readlink(srcPath).then(function(link){
                        return rfs.symlink(link, distPath);
                    });
                }

                return rfs.readFile(srcPath).then(function(content) {
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

// no err argument
['exists'].forEach(function(key) {
    rfs[key] = function(path) {
        return rx.then(function(fn) {
            fs[key](path, fn);
        });
    }
});

