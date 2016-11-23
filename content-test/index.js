const req = require.context(".", true, /\.test\.js$/);
const files = req.keys();
const globals = require("shims/_utils/globals");
const {overrideGlobals, overrideConsoleError} = require("test/test-utils");

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

describe("ActivtyStreams", () => {
  let restores;
  before(() => {
    restores = [
      overrideConsoleError(message => {throw new Error(message);}),
      overrideGlobals(globals)
    ];
  });
  after(() => {
    restores.forEach(fn => fn());
  });

  it("should run the tests", () => {
    files.forEach(file => req(file));
    // In order to target specific files, comment out the above line and uncomment/edit the following:
    // require("./addon/PrefsProvider.test.js");
  });
});
