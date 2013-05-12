var Promise = require('./promise');

module.exports = {
    Event: require('./event'),
    Promise: Promise,

    then: function(fn) {
        return new Promise(fn);
    },

    when: function() {
        return Promise.when.apply(Promise, arguments);
    }
};