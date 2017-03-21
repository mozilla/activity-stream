const {GlobalOverrider, getBaseOverrides} = require("test/unit/utils");

const req = require.context(".", true, /\.test\.js$/);
const files = req.keys();

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

let overrider = new GlobalOverrider();
overrider.set({
  Components: {
    utils: {
      import: overrider.sandbox.spy(),
      reportError: overrider.sandbox.spy()
    }
  },
  XPCOMUtils: {
    defineLazyModuleGetter: overrider.sandbox.spy(),
    defineLazyServiceGetter: overrider.sandbox.spy()
  },
  dump: overrider.sandbox.spy()
});

describe("activity-stream", () => {
  afterEach(() => overrider.reset());
  after(() => overrider.restore());
  files.forEach(file => req(file));
});
