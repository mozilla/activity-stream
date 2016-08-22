const getBestImage = require("lib/getBestImage");
const {IMG_WIDTH, IMG_HEIGHT} = getBestImage;

describe("getBestImage", () => {
  it("should return null if images is falsey", () => {
    assert.equal(getBestImage(), null);
    assert.equal(getBestImage(null), null);
  });
  it("should return null if images is an empty array", () => {
    assert.equal(getBestImage([]), null);
  });
  it("should use a valid image that is big enough", () => {
    const img = {url: "foo.jpg", height: IMG_HEIGHT, width: IMG_WIDTH};
    assert.equal(getBestImage([img]), img);
  });
  it("should skip images that are too small", () => {
    assert.equal(getBestImage([{url: "foo.jpg", height: IMG_HEIGHT - 1, width: IMG_WIDTH}]), null);
    assert.equal(getBestImage([{url: "foo.jpg", height: IMG_HEIGHT, width: IMG_WIDTH - 1}]), null);
  });
  it("should skip images without a url", () => {
    assert.equal(getBestImage([{height: IMG_HEIGHT, width: IMG_WIDTH}]), null);
  });
  it("should use the first image in the array", () => {
    const images = [
      {url: "foo.jpg", height: IMG_HEIGHT, width: IMG_WIDTH, entropy: 1},
      {url: "bar.jpg", height: IMG_HEIGHT, width: IMG_WIDTH, entropy: 3}
    ];
    assert.equal(getBestImage(images), images[0]);
  });
});
