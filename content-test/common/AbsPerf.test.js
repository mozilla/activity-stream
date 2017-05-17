const {_AbsPerf} = require("common/AbsPerf");

let absPerf;

describe("_AbsPerf", () => {
  beforeEach(() => {
    absPerf = new _AbsPerf();
  });

  describe("#now", () => {
    it("should return a number", () => {
      let n = absPerf.now();

      assert.isNumber(n);
    });

    it("should return an integer", () => {
      let n = absPerf.now();

      assert(n % 1 === 0);
    });

    // +1 is to account for possible rounding up.
    it("should return a value <= Math.round(performance.timing.navigationStart + performance.now())", () => {
      let n = absPerf.now();

      // since the following statement runs later than the call to absPerf.now,
      // the result of absPerf.now, even with rounding, better not be more.
      assert.isAtMost(n,
         Math.round(performance.timing.navigationStart + performance.now()));
    });
  });
});
