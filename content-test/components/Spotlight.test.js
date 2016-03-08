const {assert} = require("chai");
const moment = require("moment");
const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {Spotlight, SpotlightItem} = ConnectedSpotlight;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const fakeSpotlightItems = require("test/test-utils").mockData.Spotlight.rows;

const fakeSiteWithImage = {
  "title": "man throws alligator in wendys wptv dnt cnn",
  "url": "http://www.cnn.com/videos/tv/2016/02/09/man-throws-alligator-in-wendys-wptv-dnt.cnn",
  "description": "A Florida man faces multiple charges for throwing an alligator through a Wendy's drive-thru window. CNN's affiliate WPTV reports.",
  "lastVisitDate": 1456426160465,
  "bestImage": {
    "url": "http://i2.cdn.turner.com/cnnnext/dam/assets/160209053130-man-throws-alligator-in-wendys-wptv-dnt-00004611-large-169.jpg",
    "height": 259,
    "width": 460,
    "entropy": 3.98714569089,
    "size": 14757
  }
};

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
      assert.include(instance.refs.image.style.backgroundImage, fakeSite.bestImage.url);
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
    it("should call onDelete callback with url when delete icon is pressed", done => {
      function onDelete(url) {
        assert.equal(url, fakeSite.url);
        done();
      }
      const spotlight = TestUtils.renderIntoDocument(<SpotlightItem onDelete={onDelete} {...fakeSite} />);
      const button = spotlight.refs.delete;
      TestUtils.Simulate.click(button);
    });
  });
});
