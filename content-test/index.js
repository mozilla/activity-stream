const req = require.context(".", true, /\.test.js$/);
const files = req.keys();
const {overrideConsoleError} = require("test/test-utils");

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

describe("ActivtyStreams", () => {
  let restore;
  let originalAlert;
  let originalConfirm;
  before(() => {
    originalAlert = window.alert;
    window.alert = () => {};
    restore = overrideConsoleError(message => {
      throw new Error(message);
    });
    originalConfirm = window.confirm;
    window.confirm = () => true;
  });
  after(() => {
    restore();
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  });

  files.forEach(file => req(file));
  // In order to target specific files, comment out the above line and uncomment/edit the following:
  // require("./addon/PrefsProvider.test.js");
});
