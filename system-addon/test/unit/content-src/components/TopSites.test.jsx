const React = require("react");
const {shallow} = require("enzyme");
const {_unconnected: TopSites, TopSite} = require("content-src/components/TopSites/TopSites");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");

const DEFAULT_PROPS = {
  TopSites: {rows: []},
  dispatch() {}
};

describe("<TopSites>", () => {
  it("should render a TopSites element", () => {
    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });
  it("should render a TopSite for each link with the right url", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}];

    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} TopSites={{rows}} />);

    const links = wrapper.find(TopSite);
    assert.lengthOf(links, 2);
    links.forEach((link, i) => assert.equal(link.props().link.url, rows[i].url));
  });
});

describe("<TopSite>", () => {
  let link;
  beforeEach(() => {
    link = {url: "https://foo.com", screenshot: "foo.jpg"};
  });

  it("should render a TopSite", () => {
    const wrapper = shallow(<TopSite link={link} />);
    assert.ok(wrapper.exists());
  });
  it("should add the right url", () => {
    link.url = "https://www.foobar.org";
    const wrapper = shallow(<TopSite link={link} />);
    assert.propertyVal(wrapper.find("a").props(), "href", "https://www.foobar.org");
  });
  it("should render a shortened title based off the url", () => {
    link.url = "https://www.foobar.org";
    link.eTLD = "org";
    const wrapper = shallow(<TopSite link={link} />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), "foobar");
  });
  it("should fallback to link title for file:// protocol", () => {
    link.url = "file:///Users/voprea/Work/activity-stream/logs/coverage/system-addon/report-html/index.html";
    link.title = "Code coverage report";
    const wrapper = shallow(<TopSite link={link} />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), link.title);
  });
  it("should render the pinTitle if set", () => {
    link.isPinned = true;
    link.pinnedIndex = 7;
    link.pinTitle = "pinned";
    const wrapper = shallow(<TopSite link={link} />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), "pinned");
  });
  it("should render the pin icon for pinned links", () => {
    link.isPinned = true;
    link.pinnedIndex = 7;
    link.pinTitle = "pinned";
    const wrapper = shallow(<TopSite link={link} />);
    assert.equal(wrapper.find(".icon-pin-small").length, 1);
  });
  it("should not render the pin icon for non pinned links", () => {
    link.isPinned = false;
    const wrapper = shallow(<TopSite link={link} />);
    assert.equal(wrapper.find(".icon-pin-small").length, 0);
  });
  it("should render the first letter of the title as a fallback for missing screenshots", () => {
    const wrapper = shallow(<TopSite link={link} />);
    assert.equal(wrapper.find(".letter-fallback").text(), "f");
  });
  it("should render a screenshot with the .active class, if it is provided", () => {
    const wrapper = shallow(<TopSite link={link} />);
    const screenshotEl = wrapper.find(".screenshot");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
  });
  it("should not add the .active class to the screenshot element if no screenshot prop is provided", () => {
    link.screenshot = null;
    const wrapper = shallow(<TopSite link={link} />);
    assert.isFalse(wrapper.find(".screenshot").hasClass("active"));
  });
  it("should have .active class, on top-site-outer if context menu is open", () => {
    const wrapper = shallow(<TopSite link={link} index={1} />);
    wrapper.setState({showContextMenu: true, activeTile: 1});
    const topSiteEl = wrapper.find(".top-site-outer");
    assert.isTrue(topSiteEl.hasClass("active"));
  });
  it("should not add .active class, on top-site-outer if context menu is closed", () => {
    const wrapper = shallow(<TopSite link={link} index={1} />);
    wrapper.setState({showContextMenu: false, activeTile: 1});
    const topSiteEl = wrapper.find(".top-site-outer");
    assert.isFalse(topSiteEl.hasClass("active"));
  });
  it("should render a context menu button", () => {
    const wrapper = shallow(<TopSite link={link} />);
    assert.equal(wrapper.find(".context-menu-button").length, 1);
  });
  it("should render a link menu when button is clicked", () => {
    const wrapper = shallow(<TopSite link={link} />);
    let button = wrapper.find(".context-menu-button");
    button.simulate("click", {preventDefault: () => {}});
    assert.isTrue(wrapper.find(LinkMenu).props().visible);
  });
  it("should not render a link menu by default", () => {
    const wrapper = shallow(<TopSite link={link} />);
    assert.isFalse(wrapper.find(LinkMenu).props().visible);
  });
  it("should pass visible, onUpdate, site, options, and index to LinkMenu", () => {
    const wrapper = shallow(<TopSite link={link} />);
    const linkMenuProps = wrapper.find(LinkMenu).props();
    ["visible", "onUpdate", "site", "index", "options"].forEach(prop => assert.property(linkMenuProps, prop));
  });
  it("should pass through the correct menu options to LinkMenu", () => {
    const wrapper = shallow(<TopSite link={link} />);
    const linkMenuProps = wrapper.find(LinkMenu).props();
    assert.deepEqual(linkMenuProps.options,
      ["CheckPinTopSite", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl", "DeleteUrl"]);
  });
  describe("#trackClick", () => {
    it("should call dispatch when the link is clicked", () => {
      const dispatch = sinon.stub();
      const wrapper = shallow(<TopSite link={link} index={3} dispatch={dispatch} />);

      wrapper.find("a").simulate("click", {});

      assert.calledOnce(dispatch);
    });
    it("should dispatch a UserEventAction with the right data", () => {
      const dispatch = sinon.stub();
      const wrapper = shallow(<TopSite link={link} index={3} dispatch={dispatch} />);

      wrapper.find("a").simulate("click", {});

      const action = dispatch.firstCall.args[0];
      assert.isUserEventAction(action);

      assert.propertyVal(action.data, "event", "CLICK");
      assert.propertyVal(action.data, "source", "TOP_SITES");
      assert.propertyVal(action.data, "action_position", 3);
    });
  });
});
