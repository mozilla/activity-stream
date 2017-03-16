const req = require.context(".", true, /\.test\.js$/);
const files = req.keys();

// This exposes sinon assertions to chai.assert
sinon.assert.expose(assert, {prefix: ""});

describe("activity-stream", () => {
  it("should run the tests", () => {
    files.forEach(file => req(file));
  });
});
