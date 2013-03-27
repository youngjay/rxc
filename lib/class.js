var _ = require('underscore');
var slice = [].slice;


var INITS = '__inits';

var Abstract = function() {};

// 避免把Abstract本身作为构造函数
Abstract.prototype[INITS] = [];

_.extend(Abstract, {
    mix: function() {
        var self = this;
        var proto = this.prototype;

        var inits = proto[INITS];

        // proto[INITS] 在这里可能会被覆盖掉，但是没关系，最后会又给它赋值
        _.each(arguments, function(o) {
            if (!o) {
                return;
            }

            if (typeof o === 'function') {
                var srcProto = o.prototype;

                if (srcProto[INITS]) {
                    inits.push.apply(inits, srcProto[INITS]);
                } else {
                    inits.push(o);
                }

                _.extend(proto, srcProto);
                _.extend(self, o);
                return;
            }

            if (typeof o === 'object') {
                _.extend(proto, o);
                return;
            }                    
            
            console.log(o);
            throw new Error('`mix` called with invalid arg type');   
        });

        proto[INITS] = _.uniq(inits);
        proto.constructor = this;

        return this;
    },       

    mixStatic: function() {
        var self = this;
        _.each(arguments, function(o) {
            if (typeof o === 'object') {
                _.extend(self, o);
                return;
            }

            console.log(o);
            throw new Error('`mixStatic` called with invalid arg type');                
        });
        return this;
    },
    
    extend: function() {
        var Class = function() {
            var self = this, args = arguments;
            _.each(this[INITS], function(init) {
                init.apply(self, args);
            });
        };

        Class.prototype[INITS] = [];

        // 把parent 加入mixin列表
        [].unshift.call(arguments, this);

        return this.mix.apply(Class, arguments);
    },

    // o是否实现了Class的接口
    test: function(o) {
        return _.all(this.prototype, function(value, key) {
            return typeof value === typeof o[key];
        });
    }
});

module.exports = Abstract.extend();


