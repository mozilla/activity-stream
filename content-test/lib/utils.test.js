const {assert} = require("chai");
const utils = require("lib/utils");

describe("toRGBString", () => {
  it("should convert R, G, B values to a css string", () => {
    assert.equal(utils.toRGBString(12, 20, 30), "rgb(12, 20, 30)");
  });
  it("should convert R, G, B, A values to a css string", () => {
    assert.equal(utils.toRGBString(12, 20, 30, 0.2), "rgba(12, 20, 30, 0.2)");
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

describe("prettyUrl()", () => {
  it("should return a blank string if url is falsey", () => {
    assert.equal(utils.prettyUrl(), "");
    assert.equal(utils.prettyUrl(null), "");
  });

  it("should strip out leading http:// or https://", () => {
    assert.equal(utils.prettyUrl("http://mozilla.org/"), "mozilla.org/");
    assert.equal(utils.prettyUrl("https://mozilla.org/"), "mozilla.org/");
  });

  it("should convert to lowercase", () => {
    assert.equal(utils.prettyUrl("FOO.COM"), "foo.com");
  });

  it("should strip out leading 'www.' subdomains", () => {
    assert.equal(utils.prettyUrl("https://www.mozilla.org/"), "mozilla.org/");
  });

  it("should strip out leading 'www.' for protocol-less URLS as well", () => {
    assert.equal(utils.prettyUrl("www.foo.com"), "foo.com");
    assert.equal(utils.prettyUrl("WWW.foo.com"), "foo.com");
  });

  it("should ignore non http[s] protocols", () => {
    let url = "gopher://github.com/mozilla/";
    assert.equal(utils.prettyUrl(url), url);
  });

  it("should not www if not first subdomain", () => {
    assert.equal(utils.prettyUrl("foo.www.com"), "foo.www.com");
  });
});

describe("getRandomColor", () => {
  it("should get a random color", () => {
    const color = utils.getRandomColor();
    assert.isArray(color);
    assert.lengthOf(color, 3);
    assert.include(utils.RANDOM_COLORS, color);
  });
  it("should get a random color base on a numerical key", () => {
    const color = utils.getRandomColor(21319);
    assert.equal(utils.RANDOM_COLORS[9], color);
  });
  it("should get a random color base on a letter", () => {
    const color = utils.getRandomColor("boo"); // Char code of "b" is 98
    assert.equal(utils.RANDOM_COLORS[8], color);
  });
});

describe("getRandomFromTimestamp", () => {
  it("should return true or false", () => {
    assert.isBoolean(utils.getRandomFromTimestamp(0.5, {lastVisitDate: 1023123}));
  });
  it("should return the same value for the same timestamp", () => {
    const getValue = () => utils.getRandomFromTimestamp(0.5, {lastVisitDate: 1023123});
    const value = getValue();
    assert.equal(getValue(), value);
    assert.equal(getValue(), value);
    assert.equal(getValue(), value);
    assert.equal(getValue(), value);
    assert.equal(getValue(), value);
    assert.equal(getValue(), value);
  });
});
