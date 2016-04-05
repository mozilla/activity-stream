const req = require.context(".", true, /\.test.js$/);
const files = req.keys();
const {overrideConsoleError} = require("test/test-utils");

describe("ActivtyStreams", () => {
  let restore;
  before(() => {
    restore = overrideConsoleError(message => {
      throw new Error(message);
    });
  });
  after(() => restore());
  files.forEach(file => req(file));
});

// require("test/components/NewTabPage.test.js");
