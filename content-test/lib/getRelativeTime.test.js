const getRelativeTime = require("lib/getRelativeTime");
const moment = require("moment");

describe("getRelativeTime", () => {
  it("should show <1m for ~seconds", () => {
    assert.equal(getRelativeTime(moment().valueOf()).timestampID, "time_label_less_than_minute");
    assert.equal(getRelativeTime(moment().subtract(30, "seconds").valueOf()).timestampID, "time_label_less_than_minute");
  });

  // eslint-disable-next-line no-template-curly-in-string
  it("should show ${n}m for ~minutes", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "minutes").valueOf()).timestampID, "time_label_minute");
    assert.equal(getRelativeTime(moment().subtract(1, "minutes").valueOf()).timestampNumber, "1");
    assert.equal(getRelativeTime(moment().subtract(5, "minutes").valueOf()).timestampNumber, "5");
  });

  // eslint-disable-next-line no-template-curly-in-string
  it("should show ${n}h for ~hours", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "hours").valueOf()).timestampID, "time_label_hour");
    assert.equal(getRelativeTime(moment().subtract(1, "hours").valueOf()).timestampNumber, "1");
    assert.equal(getRelativeTime(moment().subtract(5, "hours").valueOf()).timestampNumber, "5");
  });

  // eslint-disable-next-line no-template-curly-in-string
  it("should show ${n}d for ~days", () => {
    assert.equal(getRelativeTime(moment().subtract(1, "days").valueOf()).timestampID, "time_label_day");
    assert.equal(getRelativeTime(moment().subtract(1, "days").valueOf()).timestampNumber, "1");
    assert.equal(getRelativeTime(moment().subtract(5, "days").valueOf()).timestampNumber, "5");
  });
});
