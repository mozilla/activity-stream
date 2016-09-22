const req = require.context(".", true, /\.test.js$/);
const files = req.keys();
const {overrideGlobals, overrideConsoleError} = require("test/test-utils");

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});


describe("ActivtyStreams", () => {
  let restores;
  before(() => {
    restores = [
      overrideConsoleError(message => {throw new Error(message);}),
      overrideGlobals()
    ];
  });
  after(() => {
    restores.forEach(fn => fn());
  });

  files.forEach(file => req(file));
  // In order to target specific files, comment out the above line and uncomment/edit the following:
  // require("./addon/PrefsProvider.test.js");
});
