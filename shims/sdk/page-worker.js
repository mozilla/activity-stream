const EventEmitter = require("shims/_utils/EventEmitter");

function Page(options) {
  const page = {};
  page.options = options;
  page.port = new EventEmitter();
  page.destroy = sinon.spy();
  return page;
}

module.exports = {Page};
