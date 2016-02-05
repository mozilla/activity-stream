const assert = require("chai").assert;
const TopSites = require("components/TopSites/TopSites");
const React = require("react");
const ReactDOM = require("react-dom");
const fakeProps = {
  sites: [
    {
      title: "tile1",
      image: "https://example.com/image.jpg",
      url: "https://example.com/"
    },
    {
      title: "tile2",
      leadImage: "https://example.org/leadImage.jpg",
      url: "https://example.org/"
    }
  ]
};

describe("TopSites", () => {

  let node, topSites, el;
  beforeEach(() => {
    node = document.createElement("div");
    topSites = ReactDOM.render(<TopSites {...fakeProps} />, node);
    el = ReactDOM.findDOMNode(topSites);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("valid sites", () => {
    it("should create TopSites", () => {
      assert.instanceOf(topSites, TopSites);
    });

    it("should have 2 images", () => {
      const imgEls = el.querySelectorAll(".tile-img");
      assert.equal(imgEls.length, fakeProps.sites.length);
      assert.include(imgEls[0].style.backgroundImage, fakeProps.sites[0].image);
      assert.include(imgEls[1].style.backgroundImage, fakeProps.sites[1].leadImage);
    });

    it("should have the right titles", () => {
      const titleEls = el.querySelectorAll(".tile-title");
      assert.equal(titleEls.length, fakeProps.sites.length);
      assert.equal(titleEls[0].innerHTML, fakeProps.sites[0].title);
      assert.equal(titleEls[1].innerHTML, fakeProps.sites[1].title);
    });

    it("should have the right links", () => {
      const linkEls = el.querySelectorAll(".tile");
      assert.equal(linkEls.length, fakeProps.sites.length);
      assert.equal(linkEls[0].href, fakeProps.sites[0].url);
      assert.equal(linkEls[1].href, fakeProps.sites[1].url);
    });
  });

});
