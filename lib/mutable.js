var PreservedSubscribable = require('./preserved-subscribable');

module.exports = PreservedSubscribable.extend(
    function() {
        if (arguments.length) {
            this.value.apply(this, arguments);
        }
    },
    {
        value: function() {
            this._notify.apply(this, arguments);
        }
    }
);