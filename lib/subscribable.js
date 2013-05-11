var slice = [].slice;

var noop = function() {};

module.exports = require('./class')
    .extend(
        function() {
            this.__subscribers = [];
        },
        {
            subscribe: function(fn) {
                if (!fn) {
                    fn = noop;
                }
                var subscribers = this.__subscribers;
                subscribers.push(fn);
                return function() {
                    var i = subscribers.indexOf(fn);
                    if (i !== -1) {
                        subscribers.splice(i, 1);
                    }
                };
            },

            _notify: function() {
                var args = arguments;
                slice.call(this.__subscribers).forEach(function(subscriber) {
                    subscriber.apply(null, args);
                });
            }
        }
    );