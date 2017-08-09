const React = require("react");
const createMockRaf = require("mock-raf");
const {shallow} = require("enzyme");
const {_unconnected: TopSitesPerfTimer, TopSite, TopSites} = require("content-src/components/TopSites/TopSites");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");

const perfSvc = {
  mark() {},
  getMostRecentAbsMarkStartByName() {}
};

const DEFAULT_PROPS = {
  TopSites: {initialized: true, rows: []},
  dispatch() {},
  perfSvc
};

describe("<TopSitesPerfTimer>", () => {
  let mockRaf;
  let sandbox;

  beforeEach(() => {
    mockRaf = createMockRaf();
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, "requestAnimationFrame").callsFake(mockRaf.raf);
  });
  afterEach(() => {
    sandbox.restore();
  });

  it("should render <TopSites {...this.props}>", () => {
    const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
    const props = wrapper.find(TopSites).shallow().instance().props;

    assert.deepEqual(props, DEFAULT_PROPS);
  });

  describe("#_componentDidMount", () => {
    it("should call _maybeSendPaintedEvent", () => {
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_maybeSendPaintedEvent");

      instance.componentDidMount();

      assert.calledOnce(stub);
    });
  });

  describe("#_componentDidUpdate", () => {
    it("should call _maybeSendPaintedEvent", () => {
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_maybeSendPaintedEvent");

      instance.componentDidUpdate();

      assert.calledOnce(stub);
    });
  });

  describe("#_maybeSendPaintedEvent", () => {
    it("should call _afterFramePaint if props.TopSites.initialized is true", () => {
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");

      instance._maybeSendPaintedEvent();

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, instance._sendPaintedEvent);
    });
    it("should not call _afterFramePaint if props.TopSites.initialized is false", () => {
      sandbox.stub(DEFAULT_PROPS.TopSites, "initialized").value(false);
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");

      instance._maybeSendPaintedEvent();

      assert.notCalled(stub);
    });

    it("should not call _afterFramePaint if this._timestampHandled is true", () => {
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");
      instance._timestampHandled = true;

      instance._maybeSendPaintedEvent();

      assert.notCalled(stub);
    });

    it("should set this._timestampHandled=true when called with Topsites.initialized === true", () => {
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();
      sandbox.stub(instance, "_afterFramePaint");
      instance._timestampHandled = false;

      instance._maybeSendPaintedEvent();

      assert.isTrue(instance._timestampHandled);
    });
    it("should not set this._timestampHandled=true when called with Topsites.initialized === false", () => {
      let props = {};
      Object.assign(props, DEFAULT_PROPS, {TopSites: {initialized: false}});
      const wrapper = shallow(<TopSitesPerfTimer {...props} />);
      const instance = wrapper.instance();
      sandbox.stub(instance, "_afterFramePaint");
      instance._timestampHandled = false;

      instance._maybeSendPaintedEvent();

      assert.isFalse(instance._timestampHandled);
    });
  });

  describe("#_afterFramePaint", () => {
    it("should call callback after the requestAnimationFrame callback returns", done => {
      this.callback = () => done();
      sandbox.spy(this, "callback");
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);
      const instance = wrapper.instance();

      instance._afterFramePaint(this.callback);

      assert.notCalled(this.callback);
      mockRaf.step({count: 1});
    });
  });

  describe("#_sendPaintedEvent", () => {
    it("should call perfSvc.mark with 'topsites_first_painted_ts'", () => {
      sandbox.spy(perfSvc, "mark");
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);

      wrapper.instance()._sendPaintedEvent();

      assert.calledOnce(perfSvc.mark);
      assert.calledWithExactly(perfSvc.mark, "topsites_first_painted_ts");
    });

    it("should send a SAVE_SESSION_PERF_DATA message with the result of perfSvc.getMostRecentAbsMarkStartByName", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName")
        .withArgs("topsites_first_painted_ts").returns(777);
      const spy = sandbox.spy(DEFAULT_PROPS, "dispatch");
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);

      wrapper.instance()._sendPaintedEvent();

      assert.calledOnce(spy);
      assert.calledWithExactly(spy, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {topsites_first_painted_ts: 777}
      }));
    });

    it("shouldn't dispatch if getMostRecentAbsMarkStartByName throws", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName")
        .withArgs("topsites_first_painted_ts").throws();
      const spy = sandbox.spy(DEFAULT_PROPS, "dispatch");
      const wrapper = shallow(<TopSitesPerfTimer {...DEFAULT_PROPS} />);

      wrapper.instance()._sendPaintedEvent();

      assert.notCalled(spy);
    });
  });
});

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
    link = {url: "https://foo.com", screenshot: "foo.jpg", hostname: "foo"};
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
  it("should have rtl direction automatically set for text", () => {
    const wrapper = shallow(<TopSite link={link} />);

    assert.isTrue(wrapper.find("[dir='auto']").length > 0);
  });
  it("should render a shortened title based off the url", () => {
    link.url = "https://www.foobar.org";
    link.hostname = "foobar";
    link.eTLD = "org";
    const wrapper = shallow(<TopSite link={link} />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), "foobar");
  });
  it("should render the pin icon for pinned links", () => {
    link.isPinned = true;
    link.pinnedIndex = 7;
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
  it("should render the tippy top icon if provided", () => {
    link.tippyTopIcon = "foo.png";
    link.backgroundColor = "#FFFFFF";
    const wrapper = shallow(<TopSite link={link} />);
    assert.equal(wrapper.find(".screenshot").length, 0);
    const tippyTop = wrapper.find(".tippy-top-icon");
    assert.propertyVal(tippyTop.props().style, "backgroundImage", "url(foo.png)");
    assert.propertyVal(tippyTop.props().style, "backgroundColor", "#FFFFFF");
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
