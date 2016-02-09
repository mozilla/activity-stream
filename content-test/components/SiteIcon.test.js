const {assert} = require("chai");
const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {SiteIconImage, SiteIconFallback, DEFAULT_FALLBACK_BG_COLOR} = SiteIcon;

const fakeProps = {
  site: {
    icons: [{url: "icon.png"}],
    title: "Foo",
    favicon_colors: [{color: [11, 11, 11]}]
  },
  className: "foo"
};

describe("SiteIcon", () => {
  let instance;
  let el;
  let iconInstance;
  let iconEl;

  function setup(customProps = {}) {
    const props = Object.assign({}, fakeProps, customProps);
    instance = TestUtils.renderIntoDocument(<SiteIcon {...props} />);
    el = ReactDOM.findDOMNode(instance);
    iconInstance = instance.refs.icon;
    iconEl = ReactDOM.findDOMNode(iconInstance);
  }

  beforeEach(() => setup());

  describe("SiteIcon", () => {
    it("should create a SiteIcon instance", () => {
      assert.instanceOf(instance, SiteIcon);
    });
    it("should add className if included on element", () => {
      console.log(el);
      assert.equal(el.className, "site-icon foo");
    });
    it("should have a height/width by default", () => {
      assert.ok(el.style.height);
      assert.ok(el.style.width);
    });
    it("should set height and width if defined", () => {
      setup({height: 200, width: 300});
      assert.equal(el.style.height, "200px");
      assert.equal(el.style.width, "300px");
    });
    it("should show image element if icons property exists on site", () => {
      assert.instanceOf(instance.refs.icon, SiteIconImage);
    });
    it("should show fallback if there is no icons property", () => {
      setup({site: {
        favicon_colors: [{color: [11, 11, 11]}],
        title: "Foo"
      }});
      assert.instanceOf(instance.refs.icon, SiteIconFallback);
    });
    it("should show a fallback if the icons array is empty", () => {
      setup({site: {
        favicon_colors: [{color: [11, 11, 11]}],
        title: "Foo",
        icons: []
      }});
      assert.instanceOf(instance.refs.icon, SiteIconFallback);
    });
  });

  describe("SiteIconImage", () => {
    beforeEach(() => {
      iconInstance = instance.refs.icon;
      iconEl = ReactDOM.findDOMNode(iconInstance);
    });

    it("should display the icon image", () => {
      assert.ok(iconEl.style.backgroundImage);
      assert.include(iconEl.style.backgroundImage, fakeProps.site.icons[0].url);
    });
  });

  describe("SiteIconFallback", () => {
    it("should show a fallback with favicon_colors, a letter if no site.icons doesn't exist", () => {
      setup({site: {
        favicon_colors: [{color: [11, 11, 11]}],
        title: "Foo"
      }});
      assert.equal(iconEl.style.backgroundColor, "rgb(11, 11, 11)");
      assert.equal(iconEl.innerHTML, "F");
    });
    it("should use provider_name, provider_display, or title for letter in order", () => {
      setup({site: {
        provider_name: "Foo",
        provider_display: "Boo",
        title: "Loo"
      }});
      assert.equal(iconEl.innerHTML, "F");
      setup({site: {
        provider_display: "Boo",
        title: "Loo"
      }});
      assert.equal(iconEl.innerHTML, "B");
      setup({site: {title: "Loo"}});
      assert.equal(iconEl.innerHTML, "L");
    });

    it("should show a fallback with default color if favicon_colors is missing or empty", () => {
      setup({site: {title: "Foo"}});
      assert.equal(iconEl.style.backgroundColor, `rgb(${DEFAULT_FALLBACK_BG_COLOR.join(", ")})`);
      setup({site: {title: "Foo", favicon_colors: []}});
      assert.equal(iconEl.style.backgroundColor, `rgb(${DEFAULT_FALLBACK_BG_COLOR.join(", ")})`);
    });
  });

});
