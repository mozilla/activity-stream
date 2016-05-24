const {assert} = require("chai");
const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const MediaPreview = require("components/MediaPreview/MediaPreview");

const fakeProps = {
  previewInfo: {
    previewURL: "https://www.youtube.com/embed/lDv68xYHFXM",
    thumbnail: {
      "url": "https://i.ytimg.com/vi/lDv68xYHFXM/hqdefault.jpg",
      "height": 360,
      "width": 480,
    },
    type: "video",
  }
};

describe("MediaPreview", () => {
  let instance;
  let el;

  function setup(customPreviewProps = {}) {
    const previewInfo = Object.assign({}, fakeProps.previewInfo, customPreviewProps);
    instance = TestUtils.renderIntoDocument(<MediaPreview {...{previewInfo}} />);
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(() => setup());

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      TestUtils.renderIntoDocument(<MediaPreview />);
    });
  });

  it("should create a MediaPreview instance", () => {
    assert.instanceOf(instance, MediaPreview);
  });

  it("should have a background thumbnail", () => {
    assert.equal(el.style.backgroundImage, `url("${fakeProps.previewInfo.thumbnail.url}")`);
  });

  it("should show the video iframe when the preview is clicked", () => {
    TestUtils.Simulate.click(el);
    const previewPlayer = instance.refs.previewPlayer;
    assert.equal(previewPlayer.src, fakeProps.previewInfo.previewURL);
  });

  it("should not show the iframe when clicked and previewURL is falsey", () => {
    setup({previewURL: null});
    TestUtils.Simulate.click(el);
    const previewPlayer = instance.refs.previewPlayer;
    assert.isUndefined(previewPlayer);
  });
});
