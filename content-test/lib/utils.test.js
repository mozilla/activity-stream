const {assert} = require("chai");
const utils = require("lib/utils");

describe("toRGBString", () => {
  it("should convert R, G, B values to a css string", () => {
    assert.equal(utils.toRGBString(12, 20, 30), "rgb(12, 20, 30)");
  });
});

describe("getBlackOrWhite", () => {
  it("should return black for a light color", () => {
    assert.equal(utils.getBlackOrWhite(230, 210, 210), "black");
  });
  it("should return white for a dark color", () => {
    assert.equal(utils.getBlackOrWhite(40, 44, 52), "white");
  });
});
