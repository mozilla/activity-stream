const getRelativeTime = require("lib/getRelativeTime");
const moment = require("moment");

describe("getRelativeTime", () => {
  it("should show <1m for ~seconds", () => {
    assert.equal(getRelativeTime(moment().valueOf()), "<1m");
    assert.equal(getRelativeTime(moment().subtract(30, "seconds").valueOf()), "<1m");
  });
  it("should show ${n}m for ~minutes", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "minutes").valueOf()), "1m");
    assert.equal(getRelativeTime(moment().subtract(5, "minutes").valueOf()), "5m");
  });
  it("should show ${n}h for ~hours", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "hours").valueOf()), "1h");
    assert.equal(getRelativeTime(moment().subtract(5, "hours").valueOf()), "5h");
  });
  it("should show ${n}h for ~days", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "days").valueOf()), "1d");
    assert.equal(getRelativeTime(moment().subtract(5, "days").valueOf()), "5d");
  });
  it("should show ${n}y for ~years", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "years").valueOf()), "1y");
    assert.equal(getRelativeTime(moment().subtract(5, "years").valueOf()), "5y");
  });
});
