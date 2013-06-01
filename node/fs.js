var fs = require('fs');
var _ = require('underscore');
var rx = require('../lib/index');
var p = require('path');
var slice = [].slice;

var fromNodeStyleMethod = function(method, args, target) {
    return rx.then(function(fn) {
        method.apply(target, slice.call(args).concat(function(err) {
            if (err) {
                console.log(err);
            } else {            
                fn.apply(null, slice.call(arguments, 1));
            }
        }));
    });
};


var returnTrue = function() {return true};

// `^` 路径开头
// `/` linux下目录分隔符
// ·\· windows下目录分隔符 
var REG_HIDDEN = new RegExp('(?:^|\\' + p.sep + ')\\.\\w+');

var isHidden = function(file) {
    return REG_HIDDEN.test(file);
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
            .then(function(fileStats, paths, callback) {
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
                
                callback(dirs);
            })
            .then(function(filesInDirs, callback) {
                callback(filesInDirs.reduce(function(all, filesInDir) {
                    return all.concat(filesInDir)
                }, []));
            });
    };
    
    return process(dir);
};

var rmr = function(path) {
    
    var process = function(curPath) {  
        return rfs.stat(curPath).then(function(stats, callback) {
            callback(stats.isDirectory() ? rmdir(curPath) : rfs.unlink(curPath))
        });
    };

    var rmdir = function(curPath) {
        return rfs.readdir(curPath)
            .then(function(subPaths, callback) {
                callback(subPaths.map(function(subPath) {
                    return process(p.join(curPath, subPath))
                }))
            })
            .then(function(results, callback) {
                callback(rfs.rmdir(curPath));
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
        .then(function(callback) {
            callback(rfs.stat(src))
        })
        .then(function(stat, callback) {
            callback(rfs.mkdir(dist, stat.mode));
        })
        .then(function(callback) {
            callback(rfs.readdir(src))
        })
        .then(function(paths, callback) {
            callback(
                paths.map(function(path) {
                    return rfs.stat(p.join(src, path));
                }),
                paths
            ) 
        })
        .then(function(stats, paths, callback) {
            callback(stats.map(function(stat, i) {
                var srcPath = p.join(src, paths[i]);
                var distPath = p.join(dist, paths[i]);

                if (stat.isDirectory()) {
                    return cpr(srcPath, distPath);
                }

                if (stat.isSymbolicLink()) {
                    return rfs.readlink(srcPath).then(function(link, callback){
                        callback(rfs.symlink(link, distPath));
                    });
                }

                return rfs.readFile(srcPath).then(function(content, callback) {
                    callback(rfs.writeFile(distPath, content));
                });
            }));
        })
        .then(function(results, callback) {
            callback();
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
            return fromNodeStyleMethod(fn, arguments);
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


