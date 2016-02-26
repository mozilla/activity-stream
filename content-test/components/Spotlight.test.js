const {assert} = require("chai");
const moment = require("moment");
const Spotlight = require("components/Spotlight/Spotlight");
const {SpotlightItem, getBestImage, IMG_WIDTH, IMG_HEIGHT} = Spotlight;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const fakeSpotlightItems = require("lib/fake-data").History.rows;

const fakeSiteWithImage = {
  "title": "man throws alligator in wendys wptv dnt cnn",
  "url": "http://www.cnn.com/videos/tv/2016/02/09/man-throws-alligator-in-wendys-wptv-dnt.cnn",
  "description": "A Florida man faces multiple charges for throwing an alligator through a Wendy's drive-thru window. CNN's affiliate WPTV reports.",
  "lastVisitDate": 1456426160465,
  "images": [
    {
      "url": "http://i2.cdn.turner.com/cnnnext/dam/assets/160209053130-man-throws-alligator-in-wendys-wptv-dnt-00004611-large-169.jpg",
      "height": 259,
      "width": 460,
      "entropy": 3.98714569089,
      "size": 14757
    },
  ]
};

// Tests that provided sites don't get rendered, because they don't
// match the conditions for spotlight to use them
function assertInvalidSite(site) {
  // merge valid site with invalid props
  const testSite = Object.assign({}, fakeSiteWithImage, site);
  const testInstance = TestUtils.renderIntoDocument(<Spotlight sites={[testSite]} length={5} />);
  const children = TestUtils.scryRenderedComponentsWithType(testInstance, SpotlightItem);
  assert.equal(children.length, 0);
}

describe("Spotlight", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<Spotlight sites={fakeSpotlightItems} />);
    el = ReactDOM.findDOMNode(instance);
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 3);
    });
    it("should skip sites that do not have a title", () => {
      assertInvalidSite({
        title: null
      });
    });
    it("should skip sites that do not have a description", () => {
      assertInvalidSite({
        description: null
      });
    });
    it("should skip sites for which the title equals the description", () => {
      assertInvalidSite({
        title: "foo",
        description: "foo"
      });
    });
    it("should skip sites that do not have an images prop or an empty array", () => {
      assertInvalidSite({
        images: null
      });
      assertInvalidSite({
        images: []
      });
    });
  });
});

describe("SpotlightItem", function() {
  const fakeSite = fakeSiteWithImage;
  let node;
  let instance;
  let el;
  beforeEach(() => {
    node = document.createElement("div");
    instance = ReactDOM.render(<SpotlightItem {...fakeSite} />, node);
    el = ReactDOM.findDOMNode(instance);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render the icon", () => {
      assert.instanceOf(instance.refs.icon, SiteIcon);
      assert.include(instance.refs.icon.props.site, fakeSite);
    });
    it("should render the image", () => {
      assert.include(instance.refs.image.style.backgroundImage, fakeSite.images[0].url);
    });
    it("should render the url link", () => {
      const linkEl = instance.refs.link;
      assert.include(linkEl.href, fakeSite.url);
    });
    it("should render the title", () => {
      assert.equal(instance.refs.title.innerHTML, fakeSite.title);
    });
    it("should render the description", () => {
      assert.include(instance.refs.description.innerHTML, fakeSite.description);
    });
    it("should render the lastVisitDate if it exists", () => {
      assert.equal(instance.refs.contextMessage.innerHTML, `Visited ${moment(fakeSiteWithImage.lastVisitDate).fromNow()}`);
    });
    it("should render the bookmarkDateCreated if it exists", () => {
      const props = Object.assign({}, fakeSite, {
        bookmarkDateCreated: 1456426160465
      });
      instance = TestUtils.renderIntoDocument(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.innerHTML, `Bookmarked ${moment(1456426160465).fromNow()}`);
    });
    it("should say 'Visited Recently' if no bookmark or timestamp are available", () => {
      const props = Object.assign({}, fakeSite, {
        lastVisitDate: null
      });
      instance = TestUtils.renderIntoDocument(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.innerHTML, "Visited recently");
    });
  });
});

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
  it("should use the image with the highest entropy", () => {
    const images = [
      {url: "foo.jpg", height: IMG_HEIGHT, width: IMG_WIDTH, entropy: 1},
      {url: "bar.jpg", height: IMG_HEIGHT, width: IMG_WIDTH, entropy: 3}
    ];
    assert.equal(getBestImage(images), images[1]);
  });
});
