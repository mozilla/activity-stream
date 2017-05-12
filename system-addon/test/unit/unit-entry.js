const {GlobalOverrider} = require("test/unit/utils");
const {chaiAssertions} = require("test/schemas/pings");

const req = require.context(".", true, /\.test\.jsx?$/);
const files = req.keys();

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

chai.use(chaiAssertions);

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
  fetch: overrider.sandbox.stub(),
  Services: {
    locale: {getRequestedLocale: overrider.sandbox.stub()},
    mm: {
      addMessageListener: overrider.sandbox.spy((msg, cb) => cb()),
      removeMessageListener: overrider.sandbox.spy()
    },
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
