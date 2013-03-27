var PreservedSubscribable = require('./preserved-subscribable');

module.exports = PreservedSubscribable.extend({
    notify: function() {
        if (this.isChanged.apply(this, arguments)) {
            this._notify.apply(this, arguments);
        }
    },

    // override
    isChanged: function(value) {
        if (this._lastValue !== value) {
            this._lastValue = value;
            return true;
        }

        return false;
    }
}); 