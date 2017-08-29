const React = require("react");
const createMockRaf = require("mock-raf");
const {shallow} = require("enzyme");
const {mountWithIntl} = require("test/unit/utils");
const {_unconnected: TopSitesPerfTimer, TopSite, TopSites, TopSitesEdit, TopSiteForm} = require("content-src/components/TopSites/TopSites");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/Reducers.jsm");

const perfSvc = {
  mark() {},
  getMostRecentAbsMarkStartByName() {}
};

const DEFAULT_PROPS = {
  TopSites: {initialized: true, rows: []},
  TopSitesCount: TOP_SITES_DEFAULT_LENGTH,
  dispatch() {},
  intl: {formatMessage: x => x},
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
      // Setting the callback to done is the test that it does finally get
      // called at the correct time, after the event loop ticks again.
      // If it doesn't get called, this test will time out.
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
  it("should slice the TopSite rows to the TopSitesCount pref", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}, {url: "https://baz.com"}, {url: "https://bam.com"}, {url: "https://zoom.com"}, {url: "https://woo.com"}, {url: "https://eh.com"}];

    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} TopSites={{rows}} TopSitesCount={TOP_SITES_DEFAULT_LENGTH} />);

    const links = wrapper.find(TopSite);
    assert.lengthOf(links, TOP_SITES_DEFAULT_LENGTH);
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

  describe("#editMode", () => {
    let wrapper;
    const defaultProps = {
      editMode: true,
      link: {url: "https://foo.com", screenshot: "foo.jpg", hostname: "foo"},
      index: 7,
      dispatch() {},
      intl: {formatMessage: x => x}
    };

    function setup(props = {}) {
      const customProps = Object.assign({}, defaultProps, props);
      wrapper = shallow(<TopSite {...customProps} />);
    }

    beforeEach(() => setup());

    it("should render the component", () => {
      assert.ok(wrapper.exists());
    });
    it("should render 3 buttons by default", () => {
      assert.equal(3, wrapper.find(".edit-menu button").length);
      assert.equal(1, wrapper.find(".icon-pin").length);
      assert.equal(1, wrapper.find(".icon-dismiss").length);
      assert.equal(1, wrapper.find(".icon-edit").length);
    });
    it("should render 3 button for a default site too", () => {
      setup({link: Object.assign({}, defaultProps.link, {isDefault: true})});
      assert.equal(3, wrapper.find(".edit-menu button").length);
      assert.equal(1, wrapper.find(".icon-pin").length);
      assert.equal(1, wrapper.find(".icon-dismiss").length);
      assert.equal(1, wrapper.find(".icon-edit").length);
    });
    it("should render the pin button if site isn't pinned", () => {
      assert.equal(1, wrapper.find(".icon-pin").length);
      assert.equal(0, wrapper.find(".icon-unpin").length);
    });
    it("should render the unpin button if site is pinned", () => {
      setup({link: Object.assign({}, defaultProps.link, {isPinned: true})});
      assert.equal(0, wrapper.find(".icon-pin").length);
      assert.equal(1, wrapper.find(".icon-unpin").length);
    });
    it("should fire a dismiss action when the dismiss button is clicked", done => {
      function dispatch(a) {
        if (a.type === at.BLOCK_URL) {
          assert.equal(a.data, defaultProps.link.url);
          done();
        }
      }
      setup({dispatch});
      wrapper.find(".icon-dismiss").simulate("click");
    });
    it("should fire a pin action when the pin button is clicked", done => {
      function dispatch(a) {
        if (a.type === at.TOP_SITES_PIN) {
          assert.equal(a.data.site.url, defaultProps.link.url);
          assert.equal(a.data.index, 7);
          done();
        }
      }
      setup({index: 7, dispatch});
      wrapper.find(".icon-pin").simulate("click");
    });
    it("should fire an unpin action when the pin button is clicked", done => {
      function dispatch(a) {
        if (a.type === at.TOP_SITES_UNPIN) {
          assert.equal(a.data.site.url, defaultProps.link.url);
          done();
        }
      }
      setup({link: Object.assign({}, defaultProps.link, {isPinned: true}), dispatch});
      wrapper.find(".icon-unpin").simulate("click");
    });
    it("should fire an unpin action when a pinned site is dismissed", done => {
      function dispatch(a) {
        if (a.type === at.TOP_SITES_UNPIN) {
          assert.equal(a.data.site.url, defaultProps.link.url);
          done();
        }
      }
      setup({link: Object.assign({}, defaultProps.link, {isPinned: true}), dispatch});
      wrapper.find(".icon-dismiss").simulate("click");
    });
    it("should call onEdit prop when the edit button is clicked", done => {
      function onEdit(index) {
        assert.equal(index, defaultProps.index);
        done();
      }
      setup({onEdit});
      wrapper.find(".icon-edit").simulate("click");
    });
  });
});

describe("<TopSitesEdit>", () => {
  let wrapper;
  function setup(props = {}) {
    const customProps = Object.assign({}, DEFAULT_PROPS, props);
    wrapper = shallow(<TopSitesEdit {...customProps} />);
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    assert.ok(wrapper.find(TopSitesEdit));
  });
  it("the modal should not be rendered by default", () => {
    assert.equal(0, wrapper.find(".modal").length);
  });
  it("the modal should be rendered when edit button is clicked", () => {
    wrapper.find(".edit").simulate("click");
    assert.equal(1, wrapper.find(".modal").length);
  });
  it("the modal should be closed when done button is clicked", () => {
    // Open the modal first.
    wrapper.find(".edit").simulate("click");
    assert.equal(1, wrapper.find(".modal").length);
    // Then click Done button to close it.
    wrapper.find(".done").simulate("click");
    assert.equal(0, wrapper.find(".modal").length);
  });
  it("the modal should be closed when this overlay is clicked", () => {
    // Open the modal first.
    wrapper.find(".edit").simulate("click");
    assert.equal(1, wrapper.find(".modal").length);
    // Then click Done button to close it.
    wrapper.find(".modal-overlay").simulate("click");
    assert.equal(0, wrapper.find(".modal").length);
  });
  it("should render a TopSite for each link with the right url", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}];
    setup({TopSites: {rows}});

    // Open the modal then check the links.
    wrapper.find(".edit").simulate("click");
    const links = wrapper.find(TopSite);
    assert.lengthOf(links, 2);
    links.forEach((link, i) => assert.equal(link.props().link.url, rows[i].url));
  });
  it("should show the 'Show more' button by default", () => {
    wrapper.find(".edit").simulate("click");
    assert.equal(1, wrapper.find(".show-more").length);
    assert.equal(0, wrapper.find(".show-less").length);
  });
  it("should show the 'Show less' button if we are showing more already", () => {
    setup({TopSitesCount: TOP_SITES_SHOWMORE_LENGTH});
    wrapper.find(".edit").simulate("click");
    assert.equal(0, wrapper.find(".show-more").length);
    assert.equal(1, wrapper.find(".show-less").length);
  });
  it("should fire a SET_PREF action when the 'Show more' button is clicked", done => {
    function dispatch(a) {
      if (a.type === at.SET_PREF) {
        assert.deepEqual(a.data, {name: "topSitesCount", value: TOP_SITES_SHOWMORE_LENGTH});
        done();
      }
    }
    setup({dispatch});
    wrapper.find(".edit").simulate("click");
    wrapper.find(".show-more").simulate("click");
  });
  it("should fire a SET_PREF action when the 'Show less' button is clicked", done => {
    function dispatch(a) {
      if (a.type === at.SET_PREF) {
        assert.deepEqual(a.data, {name: "topSitesCount", value: TOP_SITES_DEFAULT_LENGTH});
        done();
      }
    }
    setup({TopSitesCount: TOP_SITES_SHOWMORE_LENGTH, dispatch});
    wrapper.find(".edit").simulate("click");
    wrapper.find(".show-less").simulate("click");
  });
});

describe("<TopSiteForm>", () => {
  let wrapper;
  let sandbox;

  function setup(props = {}) {
    sandbox = sinon.sandbox.create();
    const customProps = Object.assign({}, {onClose: sandbox.spy(), dispatch: sandbox.spy()}, props);
    wrapper = mountWithIntl(<TopSiteForm {...customProps} />);
  }

  describe("#addMode", () => {
    beforeEach(() => setup());

    it("should render the component", () => {
      assert.ok(wrapper.find(TopSiteForm));
    });
    it("should have an Add button", () => {
      assert.equal(1, wrapper.find(".add").length);
      // and it shouldn't have a save button.
      assert.equal(0, wrapper.find(".save").length);
    });
    it("should call onClose if Cancel button is clicked", () => {
      wrapper.find(".cancel").simulate("click");
      assert.calledOnce(wrapper.instance().props.onClose);
    });
    it("should show error and not call onClose or dispatch if URL is empty", () => {
      assert.equal(0, wrapper.find(".error-tooltip").length);
      wrapper.find(".add").simulate("click");
      assert.equal(1, wrapper.find(".error-tooltip").length);
      assert.notCalled(wrapper.instance().props.onClose);
      assert.notCalled(wrapper.instance().props.dispatch);
    });
    it("should show error and not call onClose or dispatch if URL is invalid", () => {
      wrapper.setState({"url": "not valid"});
      assert.equal(0, wrapper.find(".error-tooltip").length);
      wrapper.find(".add").simulate("click");
      assert.equal(1, wrapper.find(".error-tooltip").length);
      assert.notCalled(wrapper.instance().props.onClose);
      assert.notCalled(wrapper.instance().props.dispatch);
    });
    it("should call onClose and dispatch with right args if URL is valid", () => {
      wrapper.setState({"url": "valid.com", "label": "a label"});
      wrapper.find(".add").simulate("click");
      assert.calledOnce(wrapper.instance().props.onClose);
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {site: {label: "a label", url: "http://valid.com"}},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TOP_SITES_ADD
        }
      );
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {source: "TOP_SITES", event: "TOP_SITES_ADD"},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TELEMETRY_USER_EVENT
        }
      );
    });
    it("should not pass empty string label in dispatch data", () => {
      wrapper.setState({"url": "valid.com", "label": ""});
      wrapper.find(".add").simulate("click");
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {site: {url: "http://valid.com"}},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TOP_SITES_ADD
        }
      );
    });
  });

  describe("#editMode", () => {
    beforeEach(() => setup({editMode: true, url: "https://foo.bar", label: "baz", index: 7}));

    it("should render the component", () => {
      assert.ok(wrapper.find(TopSiteForm));
    });
    it("should have a Save button", () => {
      assert.equal(1, wrapper.find(".save").length);
      // and it shouldn't have a add button.
      assert.equal(0, wrapper.find(".edit").length);
    });
    it("should call onClose if Cancel button is clicked", () => {
      wrapper.find(".cancel").simulate("click");
      assert.calledOnce(wrapper.instance().props.onClose);
    });
    it("should show error and not call onClose or dispatch if URL is empty", () => {
      wrapper.setState({"url": ""});
      assert.equal(0, wrapper.find(".error-tooltip").length);
      wrapper.find(".save").simulate("click");
      assert.equal(1, wrapper.find(".error-tooltip").length);
      assert.notCalled(wrapper.instance().props.onClose);
      assert.notCalled(wrapper.instance().props.dispatch);
    });
    it("should show error and not call onClose or dispatch if URL is invalid", () => {
      wrapper.setState({"url": "not valid"});
      assert.equal(0, wrapper.find(".error-tooltip").length);
      wrapper.find(".save").simulate("click");
      assert.equal(1, wrapper.find(".error-tooltip").length);
      assert.notCalled(wrapper.instance().props.onClose);
      assert.notCalled(wrapper.instance().props.dispatch);
    });
    it("should call onClose and dispatch with right args if URL is valid", () => {
      wrapper.find(".save").simulate("click");
      assert.calledOnce(wrapper.instance().props.onClose);
      assert.calledTwice(wrapper.instance().props.dispatch);
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {site: {label: "baz", url: "https://foo.bar"}, index: 7},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TOP_SITES_PIN
        }
      );
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {action_position: 7, source: "TOP_SITES", event: "TOP_SITES_EDIT"},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TELEMETRY_USER_EVENT
        }
      );
    });
    it("should not pass empty string label in dispatch data", () => {
      wrapper.setState({"label": ""});
      wrapper.find(".save").simulate("click");
      assert.calledWith(
        wrapper.instance().props.dispatch,
        {
          data: {site: {url: "https://foo.bar"}, index: 7},
          meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
          type: at.TOP_SITES_PIN
        }
      );
    });
  });

  describe("#validateUrl", () => {
    it("should properly validate URLs", () => {
      setup();
      wrapper.setState({"url": "mozilla.org"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "https://mozilla.org"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "http://mozilla.org"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "https://mozilla.invisionapp.com/d/main/#/projects/prototypes"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "httpfoobar"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "httpsfoo.bar"});
      assert.ok(wrapper.instance().validateUrl());
      wrapper.setState({"url": "mozilla org"});
      assert.isFalse(wrapper.instance().validateUrl());
      wrapper.setState({"url": ""});
      assert.isFalse(wrapper.instance().validateUrl());
    });
  });

  describe("#cleanUrl", () => {
    it("should properly prepend http:// to URLs when required", () => {
      setup();
      wrapper.setState({"url": "mozilla.org"});
      assert.equal("http://mozilla.org", wrapper.instance().cleanUrl());
      wrapper.setState({"url": "https.org"});
      assert.equal("http://https.org", wrapper.instance().cleanUrl());
      wrapper.setState({"url": "httpcom"});
      assert.equal("http://httpcom", wrapper.instance().cleanUrl());
      wrapper.setState({"url": "http://mozilla.org"});
      assert.equal("http://mozilla.org", wrapper.instance().cleanUrl());
      wrapper.setState({"url": "https://firefox.com"});
      assert.equal("https://firefox.com", wrapper.instance().cleanUrl());
    });
  });
});
