var slice = [].slice;

module.exports = require('./class')
    .extend(
        function() {
            this.__subscribers = [];
        },
        {
            subscribe: function(fn) {
                var subscribers = this.__subscribers;
                subscribers.push(fn);
                return function() {
                    var i = subscribers.indexOf(fn);
                    if (i !== -1) {
                        subscribers.splice(i, 1);
                    }
                };
            },

            notify: function() {
                var args = arguments;
                slice.call(this.__subscribers).forEach(function(subscriber) {
                    subscriber.apply(null, args);
                });
            }
        }
    );