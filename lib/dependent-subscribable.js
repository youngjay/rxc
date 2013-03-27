var PreservedSubscribable = require('./preserved-subscribable');
var slice = [].slice;

module.exports = PreservedSubscribable.extend(
    function(deps) {
        if (!deps.length) {
            this._notify();
            return;
        }

        var self = this;
        var results = new Array(deps.length);

        var check = function() {
            for (var i = 0; i < deps.length; i++) {
                if (!results[i]) {
                    return;
                }
            }
            notify();
        };

        var notify = function() {                
            self._notify.apply(self, results.reduce(function(ret, args) {
                ret.push.apply(ret, args);
                return ret;
            }, []));
        };

        deps.forEach(function(dep, i) {
            if (dep.subscribe) {
                dep.subscribe(function() {
                    results[i] = arguments;
                    check();
                });
            } else {
                results[i] = [dep];
                check();
            }                
        });
    },
    {
        computed: function(fn) {
            var subscribable = new PreservedSubscribable();
            this.subscribe(function() {
                fn.apply(null, slice.call(arguments).concat([function() {
                    subscribable._notify.apply(subscribable, arguments);
                }]));
            });
            return subscribable;
        }
    }
);