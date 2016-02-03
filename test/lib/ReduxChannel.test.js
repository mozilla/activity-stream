const {Channel} = require("lib/ReduxChannel");
const {assert} = require("chai");

describe("Channel", () => {
  let fakeTarget;
  beforeEach(() => {
    fakeTarget = {
      addEventListener: () => {}
    };
  });

  describe("instance", () => {
    it("should define basic instance shape", () => {
      const c = new Channel({incoming: "in", outgoing: "out", target: fakeTarget});
      assert.property(c, "options");
      assert.equal(c.options.incoming, "in");
      assert.equal(c.options.outgoing, "out");
      assert.equal(c.options.target, fakeTarget);
      assert.equal(c.options.timeout, Channel.DEFAULT_OPTIONS.timeout);
    });
  });
});
