const getVideoPreview = require("lib/getVideoPreview");

describe("getVideoPreview", () => {
  it("should return null if url is falsey", () => {
    assert.isNull(getVideoPreview());
    assert.isNull(getVideoPreview(null));
  });
  it("should return null if url is not an accepted video service url", () => {
    assert.isNull(getVideoPreview("http://foo.com"));
  });
  it("should return null for a youtube URL without a valid video id", () => {
    assert.isNull(getVideoPreview("https://www.youtube.com/feed/trending"));
  });
  it("should return null for a vimeo URL without a valid video id", () => {
    assert.isNull(getVideoPreview("https://vimeo.com/channels/staffpicks"));
  });
  it("should return an embed url for a valid youtube url", () => {
    const videoId = "lDv68xYHFXM";
    assert.equal(getVideoPreview(`https://www.youtube.com/watch?v=${videoId}`), `https://www.youtube.com/embed/${videoId}?autoplay=1`);
  });
  it("should return an embed url for a valid vimeo url", () => {
    const videoId = "1202674";
    assert.equal(getVideoPreview(`https://vimeo.com/${videoId}`), `https://player.vimeo.com/video/${videoId}?autoplay=1`);
  });
});
