var fs = require('fs');
var _ = require('underscore');
var rx = require('./index');

var rfs = {};
_.each(fs, function(fn, key) {
    if (!/Sync$/.test(key)) {
        rfs[key] = function() {
            
        }
    }
});
