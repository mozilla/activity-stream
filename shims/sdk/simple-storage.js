const EventEmitter = require("shims/_utils/EventEmitter");

class SimpleStorage extends EventEmitter {
  constructor(storage) {
    super();
    this.storage = storage || {};
    this._quotaUsage = 0;
  }
  get quotaUsage() {
    return this._quotaUsage;
  }
}

module.exports = new SimpleStorage();
module.exports.SimpleStorage = SimpleStorage;
