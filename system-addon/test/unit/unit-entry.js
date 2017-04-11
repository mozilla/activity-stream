const {GlobalOverrider} = require("test/unit/utils");

const req = require.context(".", true, /\.test\.js$/);
const files = req.keys();

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

let overrider = new GlobalOverrider();
overrider.set({
  Components: {
    interfaces: {},
    utils: {
      import: overrider.sandbox.spy(),
      importGlobalProperties: overrider.sandbox.spy(),
      reportError: overrider.sandbox.spy(),
      now: () => window.performance.now()
    }
  },
  XPCOMUtils: {
    defineLazyModuleGetter: overrider.sandbox.spy(),
    defineLazyServiceGetter: overrider.sandbox.spy(),
    generateQI: overrider.sandbox.stub().returns(() => {})
  },
  dump: overrider.sandbox.spy(),
  Services: {
    obs: {
      addObserver: overrider.sandbox.spy(),
      removeObserver: overrider.sandbox.spy()
    }
  }
});

describe("activity-stream", () => {
  afterEach(() => overrider.reset());
  after(() => overrider.restore());
  files.forEach(file => req(file));
});
