const utils = require("lib/utils");

describe("toRGBString", () => {
  it("should convert R, G, B values to a css string", () => {
    assert.equal(utils.toRGBString([12, 20, 30]), "rgb(12, 20, 30)");
  });
  it("should convert R, G, B, A values to a css string", () => {
    assert.equal(utils.toRGBString([12, 20, 30, 0.2]), "rgba(12, 20, 30, 0.2)");
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
  it("should return a blank string if url and hostname is falsey", () => {
    assert.equal(utils.prettyUrl({url: ""}), "");
    assert.equal(utils.prettyUrl({hostname: null}), "");
  });

  it("should remove the eTLD, if provided", () => {
    assert.equal(utils.prettyUrl({hostname: "com.blah.com", eTLD: "com"}), "com.blah");
  });

  it("should use the hostname, if provided", () => {
    assert.equal(utils.prettyUrl({hostname: "foo.com", url: "http://bar.com", eTLD: "com"}), "foo");
  });

  it("should get the hostname from .url if necessary", () => {
    assert.equal(utils.prettyUrl({url: "http://bar.com", eTLD: "com"}), "bar");
  });

  it("should not strip out www if not first subdomain", () => {
    assert.equal(utils.prettyUrl({hostname: "foo.www.com", eTLD: "com"}), "foo.www");
  });

  it("should convert to lowercase", () => {
    assert.equal(utils.prettyUrl({url: "HTTP://FOO.COM", eTLD: "com"}), "foo");
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
