const EventEmitter = require("shims/_utils/EventEmitter");
const {Tab} = require("shims/sdk/tabs");
module.exports.PageMod = class PageMod {
  constructor(options) {
    this.options = options;
    this.destroy = sinon.spy();
  }
};

// Utility for mocking workers
module.exports.Worker = class Worker extends EventEmitter {
  constructor(url = "foo.html") {
    super();
    this.tab = new Tab({url});
    this.port = new EventEmitter();
    this.url = url;
  }
};
