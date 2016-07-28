const {assert} = require("chai");
const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const SiteIcon = require("components/SiteIcon/SiteIcon");

const fakeProps = {
  site: {
    url: "https://foo.com",
    favicon_url: "http://www.google.com/favicon.ico",
    title: "Foo",
    favicon_colors: [{color: [11, 11, 11]}]
  },
  className: "foo"
};

describe("SiteIcon", () => {
  let instance;
  let el;

  function setup(customProps = {}, customSiteProps = {}) {
    const site = Object.assign({}, fakeProps.site, customSiteProps);
    const props = Object.assign({}, fakeProps, customProps, {site});
    instance = TestUtils.renderIntoDocument(<SiteIcon {...props} />);
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(() => setup());

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      TestUtils.renderIntoDocument(<SiteIcon />);
    });
  });

  it("should have default state", () => {
    assert.isFalse(instance.state.showFallback);
  });

  it("should create a SiteIcon instance", () => {
    assert.instanceOf(instance, SiteIcon);
  });

  it("should add className if included on element", () => {
    assert.equal(el.className, "site-icon foo");
  });

  it("should set height and width if defined", () => {
    setup({height: 200, width: 300});
    assert.equal(el.style.height, "200px");
    assert.equal(el.style.width, "300px");
  });

  describe("title", () => {
    it("should not show title be default", () => {
      assert.isTrue(instance.refs.title.hidden);
    });
  });

  describe("favicon", () => {
    it("favicon should have a height/width by default", () => {
      assert.ok(instance.refs.favicon.height);
      assert.ok(instance.refs.favicon.width);
    });

    it("should set faviconSize", () => {
      setup({faviconSize: 200});
      assert.equal(instance.refs.favicon.height, 200);
      assert.equal(instance.refs.favicon.width, 200);
    });

    it("should show favicon if it exists on site", () => {
      assert.isFalse(instance.refs.favicon.hidden);
      assert.isTrue(instance.refs.fallback.hidden);
    });

    it("should show fallback when forced even if favicon exists on site", () => {
      instance.setState({showFallback: true});
      assert.isTrue(instance.refs.favicon.hidden);
      assert.isFalse(instance.refs.fallback.hidden);
    });

    it("should set favicon_url", () => {
      assert.equal(instance.refs.favicon.src, fakeProps.site.favicon_url);
    });

    it("should use favicon as a fallback to favicon_url", () => {
      setup({}, {favicon_url: null, favicon: "https://www.wikipedia.org/static/favicon/wikipedia.ico"});
      assert.equal(instance.refs.favicon.src, "https://www.wikipedia.org/static/favicon/wikipedia.ico");
    });

    it("should use favicon for 16x16 favicon", done => {
      setup({}, {favicon_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAD0lEQVQYV2P4jwYYRrYAAID5%2FwHnXPpAAAAAAElFTkSuQmCC"});
      instance.refs.favicon.addEventListener("load", () => {
        assert.isFalse(instance.state.showFallback);
        done();
      });
    });
  });

  describe("fallback", () => {
    beforeEach(() => {
      setup({}, {
        favicon_url: null,
        favicon: null,
        favicon_colors: [{color: [0, 0, 0]}],
        url: "http://foo.com"
      });
    });
    it("should show fallback if there is no icons property", () => {
      assert.isFalse(instance.refs.fallback.hidden);
      assert.isTrue(instance.refs.favicon.hidden);
    });
    it("should show fallback on small 1x1 favicon", done => {
      setup({}, {favicon_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42gEFAPr%2FAP%2F%2F%2F%2F8J%2BwP9vTv7fQAAAABJRU5ErkJggg%3D%3D"});
      instance.refs.favicon.addEventListener("load", () => {
        assert.isTrue(instance.state.showFallback);
        done();
      });
    });
    it("should show fallback for bad favicon", done => {
      setup({}, {favicon_url: "data:text/plain,not an image"});
      instance.refs.favicon.addEventListener("error", () => {
        assert.isTrue(instance.state.showFallback);
        done();
      });
    });
    it("should have an opaque background color", () => {
      assert.equal(instance.refs.background.style.backgroundColor, "rgb(0, 0, 0)");
    });
    it("should use the first letter of the host name", () => {
      assert.equal(instance.refs.fallback.dataset.firstLetter, "f");
    });
    it("should not affect the content text", () => {
      assert.equal(instance.refs.fallback.innerHTML, "");
    });
  });
});
