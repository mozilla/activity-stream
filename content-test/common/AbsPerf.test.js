/* globals beforeEach, describe, it */
const {_AbsPerf} = require("common/AbsPerf");

let absPerf;

describe("_AbsPerf", () => {
  beforeEach(() => {
    absPerf = new _AbsPerf();
  });

  describe("#now", () => {
    it("should return a number < performance.timing.navigationStart + performance.now()", () => {
      let n = absPerf.now();

      assert.isNumber(n);
      assert.isBelow(n, performance.timing.navigationStart + performance.now());
    });
  });
});
