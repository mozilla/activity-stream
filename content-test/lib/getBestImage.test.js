const getBestImage = require("common/getBestImage");

describe("getBestImage", () => {
  it("should return null if images is falsey", () => {
    assert.equal(getBestImage(), null);
    assert.equal(getBestImage(null), null);
  });
  it("should return null if images is an empty array", () => {
    assert.equal(getBestImage([]), null);
  });
  it("should use a valid image if it is there", () => {
    const img = {url: "foo.jpg"};
    assert.equal(getBestImage([img]), img);
  });
  it("should only return one image", () => {
    const images = [{url: "foo.jpg"}];
    assert.equal([getBestImage(images)].length, 1);
  });
});
