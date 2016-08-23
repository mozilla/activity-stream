const EventEmitter = require("shims/_utils/EventEmitter");
const faker = require("faker");

/**
 * Tab
 * This is an individual tab. It will generate plausable
 * properties (e.g. id, title, etc.) You may pass it custom properties
 * if you wish
 */
class Tab extends EventEmitter {
  constructor(custom = {}) {
    super();

    // Properties
    const props = Object.assign({
      id: faker.random.uuid(),
      title: faker.hacker.phrase(),
      url: faker.internet.url(),
      favicon: faker.image.imageUrl(),
      contentType: "text/html",
      index: 0,
      isPinned: false,
      window: {},
      readyState: "complete"
    }, custom);
    Object.keys(props).forEach(key => {
      this[key] = props[key];
    });

    // Methods
    this.pin = sinon.spy();
    this.unpin = sinon.spy();
    this.open = sinon.spy();
    this.close = sinon.spy(callback => callback && callback());
    this.reload = sinon.spy();
    this.activate = sinon.spy();
    this.getThumbnail = sinon.spy();
    this.attach = sinon.spy();
  }

}

/**
 * Tabs
 * This is a stub for sdk/tabs
 */
class Tabs extends EventEmitter {
  constructor() {
    super();
    const firstTab = new Tab();
    this._tabs = new Set([firstTab]);
    this._activeTab = firstTab;

    // Methods
    this.open = sinon.spy();
  }
  get activeTab() {
    return this._activeTab;
  }
  get length() {
    return this._tabs.size;
  }
}

module.exports = new Tabs();
module.exports.Tabs = Tabs;
module.exports.Tab = Tab;
