var PreservedSubscribable = require('./preserved-subscribable');

module.exports = PreservedSubscribable.extend(
    {
        value: function() {
            this._notify.apply(this, arguments);
            return this;
        }
    }
);