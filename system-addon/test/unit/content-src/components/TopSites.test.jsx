import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {MIN_CORNER_FAVICON_SIZE, MIN_RICH_FAVICON_SIZE} from "content-src/components/TopSites/TopSitesConstants";
import {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} from "common/Reducers.jsm";
import {TopSite, TopSiteLink, _TopSiteList as TopSiteList, TopSitePlaceholder} from "content-src/components/TopSites/TopSite";
import {_TopSitesEdit as TopSitesEdit, TopSitesEdit as TopSitesEditConnected} from "content-src/components/TopSites/TopSitesEdit";
import {LinkMenu} from "content-src/components/LinkMenu/LinkMenu";
import {mountWithIntl} from "test/unit/utils";
import React from "react";
import {shallow} from "enzyme";
import {TopSiteForm} from "content-src/components/TopSites/TopSiteForm";
import {_TopSites as TopSites} from "content-src/components/TopSites/TopSites";

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

describe("<TopSites>", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a TopSites element", () => {
    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });
  it("should always render TopSitesEdit", () => {
    let rows = [{url: "https://foo.com"}];
    let wrapper = shallow(<TopSites {...DEFAULT_PROPS} TopSites={{rows}} />);
    assert.lengthOf(wrapper.find(TopSitesEditConnected), 1);

    rows = [];
    wrapper = shallow(<TopSites {...DEFAULT_PROPS} TopSites={{rows}} />);
    assert.lengthOf(wrapper.find(TopSitesEditConnected), 1);
  });
  describe("#_dispatchTopSitesStats", () => {
    let wrapper;
    let dispatchStatsSpy;

    beforeEach(() => {
      sandbox.stub(DEFAULT_PROPS, "dispatch");
      wrapper = shallow(<TopSites {...DEFAULT_PROPS} />, {disableLifecycleMethods: true});
      dispatchStatsSpy = sandbox.spy(wrapper.instance(), "_dispatchTopSitesStats");
    });
    afterEach(() => {
      sandbox.restore();
    });
    it("should call _dispatchTopSitesStats on componentDidMount", () => {
      wrapper.instance().componentDidMount();

      assert.calledOnce(dispatchStatsSpy);
    });
    it("should call _dispatchTopSitesStats on componentDidUpdate", () => {
      wrapper.instance().componentDidUpdate();

      assert.calledOnce(dispatchStatsSpy);
    });
    it("should dispatch SAVE_SESSION_PERF_DATA", () => {
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 0,
            "tippytop": 0,
            "rich_icon": 0,
            "no_image": 0
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count TopSite images - just screenshot", () => {
      const rows = [{screenshot: true}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 1,
            "tippytop": 0,
            "rich_icon": 0,
            "no_image": 0
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count TopSite images - screenshot + favicon", () => {
      const rows = [{screenshot: true, faviconSize: MIN_CORNER_FAVICON_SIZE}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 1,
            "screenshot": 0,
            "tippytop": 0,
            "rich_icon": 0,
            "no_image": 0
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count TopSite images - rich_icon", () => {
      const rows = [{faviconSize: MIN_RICH_FAVICON_SIZE}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 0,
            "tippytop": 0,
            "rich_icon": 1,
            "no_image": 0
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count TopSite images - tippytop", () => {
      const rows = [{tippyTopIcon: "foo"}, {faviconRef: "tippytop"}, {faviconRef: "foobar"}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 0,
            "tippytop": 2,
            "rich_icon": 0,
            "no_image": 1
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count TopSite images - no image", () => {
      const rows = [{}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 0,
            "tippytop": 0,
            "rich_icon": 0,
            "no_image": 1
          },
          topsites_pinned: 0
        }
      }));
    });
    it("should correctly count pinned Top Sites", () => {
      const rows = [{isPinned: true}, {isPinned: false}, {isPinned: true}];
      sandbox.stub(DEFAULT_PROPS.TopSites, "rows").value(rows);
      wrapper.instance()._dispatchTopSitesStats();

      assert.calledOnce(DEFAULT_PROPS.dispatch);
      assert.calledWithExactly(DEFAULT_PROPS.dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: {
            "screenshot_with_icon": 0,
            "screenshot": 0,
            "tippytop": 0,
            "rich_icon": 0,
            "no_image": 3
          },
          topsites_pinned: 2
        }
      }));
    });
  });
});

describe("<TopSiteLink>", () => {
  let link;
  beforeEach(() => {
    link = {url: "https://foo.com", screenshot: "foo.jpg", hostname: "foo"};
  });
  it("should add the right url", () => {
    link.url = "https://www.foobar.org";
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.propertyVal(wrapper.find("a").props(), "href", "https://www.foobar.org");
  });
  it("should have rtl direction automatically set for text", () => {
    const wrapper = shallow(<TopSiteLink link={link} />);

    assert.isTrue(wrapper.find("[dir='auto']").length > 0);
  });
  it("should render a title", () => {
    const wrapper = shallow(<TopSiteLink link={link} title="foobar" />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), "foobar");
  });
  it("should have only the title as the text of the link", () => {
    const wrapper = shallow(<TopSiteLink link={link} title="foobar" />);

    assert.equal(wrapper.find("a").text(), "foobar");
  });
  it("should render the pin icon for pinned links", () => {
    link.isPinned = true;
    link.pinnedIndex = 7;
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.equal(wrapper.find(".icon-pin-small").length, 1);
  });
  it("should not render the pin icon for non pinned links", () => {
    link.isPinned = false;
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.equal(wrapper.find(".icon-pin-small").length, 0);
  });
  it("should render the first letter of the title as a fallback for missing screenshots", () => {
    const wrapper = shallow(<TopSiteLink link={link} title={"foo"} />);
    assert.equal(wrapper.find(".tile").prop("data-fallback"), "f");
  });
  it("should render a screenshot with the .active class, if it is provided", () => {
    const wrapper = shallow(<TopSiteLink link={link} />);
    const screenshotEl = wrapper.find(".screenshot");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
  });
  it("should render a small icon with fallback letter with the screenshot if the icon is smaller than 16x16", () => {
    link.favicon = "too-small-icon.png";
    link.faviconSize = 10;
    const wrapper = shallow(<TopSiteLink link={link} title="foo" />);
    const screenshotEl = wrapper.find(".screenshot");
    const defaultIconEl = wrapper.find(".default-icon");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
    assert.lengthOf(defaultIconEl, 1);
    assert.equal(defaultIconEl.prop("data-fallback"), "f");
  });
  it("should render a small icon with fallback letter with the screenshot if the icon is missing", () => {
    const wrapper = shallow(<TopSiteLink link={link} title="foo" />);
    const screenshotEl = wrapper.find(".screenshot");
    const defaultIconEl = wrapper.find(".default-icon");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
    assert.lengthOf(defaultIconEl, 1);
    assert.equal(defaultIconEl.prop("data-fallback"), "f");
  });
  it("should render a small icon with the screenshot if the icon is bigger than 32x32", () => {
    link.favicon = "small-icon.png";
    link.faviconSize = 32;

    const wrapper = shallow(<TopSiteLink link={link} />);
    const screenshotEl = wrapper.find(".screenshot");
    const defaultIconEl = wrapper.find(".default-icon");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
    assert.propertyVal(defaultIconEl.props().style, "backgroundImage", `url(${link.favicon})`);
    assert.lengthOf(wrapper.find(".rich-icon"), 0);
  });
  it("should not add the .active class to the screenshot element if no screenshot prop is provided", () => {
    link.screenshot = null;
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.isFalse(wrapper.find(".screenshot").hasClass("active"));
  });
  it("should render the tippy top icon if provided and not a small icon", () => {
    link.tippyTopIcon = "foo.png";
    link.backgroundColor = "#FFFFFF";
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.lengthOf(wrapper.find(".screenshot"), 0);
    assert.lengthOf(wrapper.find(".default-icon"), 0);
    const tippyTop = wrapper.find(".rich-icon");
    assert.propertyVal(tippyTop.props().style, "backgroundImage", "url(foo.png)");
    assert.propertyVal(tippyTop.props().style, "backgroundColor", "#FFFFFF");
  });
  it("should render a rich icon if provided and not a small icon", () => {
    link.favicon = "foo.png";
    link.faviconSize = 196;
    link.backgroundColor = "#FFFFFF";
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.lengthOf(wrapper.find(".screenshot"), 0);
    assert.lengthOf(wrapper.find(".default-icon"), 0);
    const richIcon = wrapper.find(".rich-icon");
    assert.propertyVal(richIcon.props().style, "backgroundImage", "url(foo.png)");
    assert.propertyVal(richIcon.props().style, "backgroundColor", "#FFFFFF");
  });
  it("should not render a rich icon if it is smaller than 96x96", () => {
    link.favicon = "foo.png";
    link.faviconSize = 48;
    link.backgroundColor = "#FFFFFF";
    const wrapper = shallow(<TopSiteLink link={link} />);
    assert.equal(wrapper.find(".screenshot").length, 1);
    assert.equal(wrapper.find(".rich-icon").length, 0);
  });
  it("should apply just the default class name to the outer link if props.className is falsey", () => {
    const wrapper = shallow(<TopSiteLink className={false} />);
    assert.ok(wrapper.find("li").hasClass("top-site-outer"));
  });
  it("should add props.className to the outer link element", () => {
    const wrapper = shallow(<TopSiteLink className="foo bar" />);
    assert.ok(wrapper.find("li").hasClass("top-site-outer foo bar"));
  });
  describe("#onDragEvent", () => {
    let simulate;
    let wrapper;
    beforeEach(() => {
      wrapper = shallow(<TopSiteLink isDraggable={true} onDragEvent={() => {}} />);
      simulate = type => {
        const event = {
          dataTransfer: {setData() {}, types: {includes() {}}},
          preventDefault() {
            this.prevented = true;
          },
          target: {blur() {}},
          type
        };
        wrapper.simulate(type, event);
        return event;
      };
    });
    it("should allow clicks without dragging", () => {
      simulate("mousedown");
      simulate("mouseup");

      const event = simulate("click");

      assert.notOk(event.prevented);
    });
    it("should prevent clicks after dragging", () => {
      simulate("mousedown");
      simulate("dragstart");
      simulate("dragenter");
      simulate("drop");
      simulate("dragend");
      simulate("mouseup");

      const event = simulate("click");

      assert.ok(event.prevented);
    });
    it("should allow clicks after dragging then clicking", () => {
      simulate("mousedown");
      simulate("dragstart");
      simulate("dragenter");
      simulate("drop");
      simulate("dragend");
      simulate("mouseup");
      simulate("click");

      simulate("mousedown");
      simulate("mouseup");

      const event = simulate("click");

      assert.notOk(event.prevented);
    });
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

  it("should render a shortened title based off the url", () => {
    link.url = "https://www.foobar.org";
    link.hostname = "foobar";
    link.eTLD = "org";
    const wrapper = shallow(<TopSite link={link} />);

    assert.equal(wrapper.find(TopSiteLink).props().title, "foobar");
  });

  it("should have .active class, on top-site-outer if context menu is open", () => {
    const wrapper = shallow(<TopSite link={link} index={1} activeIndex={1} />);
    wrapper.setState({showContextMenu: true});

    assert.equal(wrapper.find(TopSiteLink).props().className, "active");
  });
  it("should not add .active class, on top-site-outer if context menu is closed", () => {
    const wrapper = shallow(<TopSite link={link} index={1} />);
    wrapper.setState({showContextMenu: false, activeTile: 1});
    assert.equal(wrapper.find(TopSiteLink).props().className, "");
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
      ["CheckPinTopSite", "EditTopSite", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl", "DeleteUrl"]);
  });

  describe("#trackClick", () => {
    it("should call dispatch when the link is clicked", () => {
      const dispatch = sinon.stub();
      const wrapper = shallow(<TopSite link={link} index={3} dispatch={dispatch} />);

      wrapper.find(TopSiteLink).simulate("click", {});

      assert.calledOnce(dispatch);
    });
    it("should dispatch a UserEventAction with the right data", () => {
      const dispatch = sinon.stub();
      const wrapper = shallow(<TopSite link={link} index={3} dispatch={dispatch} />);

      wrapper.find(TopSiteLink).simulate("click", {});

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
      onEdit() {},
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

  describe("#TopSites.editForm.visible=true", () => {
    let dispatchStub;
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      dispatchStub = sandbox.stub(DEFAULT_PROPS, "dispatch");
      setup({
        TopSites: {
          rows: [{url: "foo", label: "label"}],
          editForm: {
            visible: true,
            index: 4
          }
        }
      });
    });

    afterEach(() => { sandbox.restore(); });

    it("should render TopSitesForm", () => {
      assert.ok(wrapper.find(TopSiteForm).length === 1);
    });

    it("should provide the correct props to TopSiteForm", () => {
      const comp = wrapper.find(TopSiteForm);
      assert.equal(comp.props().index, 4);
    });

    it("should dispatch TOP_SITES_CANCEL_EDIT", () => {
      wrapper.instance().onModalOverlayClick();

      assert.calledTwice(dispatchStub);
      assert.calledWith(dispatchStub, {type: at.TOP_SITES_CANCEL_EDIT});
    });

    it("should dispatch TOP_SITES_CANCEL_EDIT", () => {
      wrapper.instance().onFormClose();

      assert.calledOnce(dispatchStub);
      assert.calledWithExactly(dispatchStub, {type: at.TOP_SITES_CANCEL_EDIT});
    });
  });

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
          type: at.TOP_SITES_INSERT
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
          type: at.TOP_SITES_INSERT
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

describe("<TopSiteList>", () => {
  it("should render a TopSiteList element", () => {
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });
  it("should render a TopSite for each link with the right url", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}];
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} />);
    const links = wrapper.find(TopSite);
    assert.lengthOf(links, 2);
    rows.forEach((row, i) => assert.equal(links.get(i).props.link.url, row.url));
  });
  it("should slice the TopSite rows to the TopSitesCount pref", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}, {url: "https://baz.com"}, {url: "https://bam.com"}, {url: "https://zoom.com"}, {url: "https://woo.com"}, {url: "https://eh.com"}];
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} TopSitesCount={TOP_SITES_DEFAULT_LENGTH} />);
    const links = wrapper.find(TopSite);
    assert.lengthOf(links, TOP_SITES_DEFAULT_LENGTH);
  });
  it("should fill with placeholders if TopSites rows is less than TopSitesCount", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}];
    const topSitesCount = 5;
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} TopSitesCount={topSitesCount} />);
    assert.lengthOf(wrapper.find(TopSite), 2, "topSites");
    assert.lengthOf(wrapper.find(TopSitePlaceholder), 3, "placeholders");
  });
  it("should fill any holes in TopSites with placeholders", () => {
    const rows = [{url: "https://foo.com"}];
    rows[3] = {url: "https://bar.com"};
    const topSitesCount = 5;
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} TopSitesCount={topSitesCount} />);
    assert.lengthOf(wrapper.find(TopSite), 2, "topSites");
    assert.lengthOf(wrapper.find(TopSitePlaceholder), 3, "placeholders");
  });
  it("should update state onDragStart and clear it onDragEnd", () => {
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} />);
    const instance = wrapper.instance();
    const index = 7;
    const link = {url: "https://foo.com"};
    const title = "foo";
    instance.onDragEvent({type: "dragstart"}, index, link, title);
    assert.equal(instance.state.draggedIndex, index);
    assert.equal(instance.state.draggedSite, link);
    assert.equal(instance.state.draggedTitle, title);
    instance.onDragEvent({type: "dragend"});
    assert.deepEqual(instance.state, instance.DEFAULT_STATE);
  });
  it("should clear state when new props arrive after a drop", () => {
    const site1 = {url: "https://foo.com"};
    const site2 = {url: "https://bar.com"};
    const rows = [site1, site2];
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} />);
    const instance = wrapper.instance();
    instance.setState({
      draggedIndex: 1,
      draggedSite: site2,
      draggedTitle: "bar",
      topSitesPreview: []
    });
    wrapper.setProps({TopSites: {rows: [site2, site1]}});
    assert.deepEqual(instance.state, instance.DEFAULT_STATE);
  });
  it("should dispatch events on drop", () => {
    const dispatch = sinon.spy();
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} dispatch={dispatch} />);
    const instance = wrapper.instance();
    const index = 7;
    const link = {url: "https://foo.com"};
    const title = "foo";
    instance.onDragEvent({type: "dragstart"}, index, link, title);
    dispatch.reset();
    instance.onDragEvent({type: "drop"}, 3);
    assert.calledTwice(dispatch);
    assert.calledWith(dispatch, {
      data: {draggedFromIndex: 7, index: 3, site: {label: "foo", url: "https://foo.com"}},
      meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
      type: "TOP_SITES_INSERT"
    });
    assert.calledWith(dispatch, {
      data: {action_position: 3, event: "DROP", source: "TOP_SITES"},
      meta: {from: "ActivityStream:Content", to: "ActivityStream:Main"},
      type: "TELEMETRY_USER_EVENT"
    });
  });
  it("should make a topSitesPreview onDragEnter", () => {
    const wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} />);
    const instance = wrapper.instance();
    const site = {url: "https://foo.com"};
    instance.setState({
      draggedIndex: 4,
      draggedSite: site,
      draggedTitle: "foo"
    });
    site.isPinned = true;
    instance.onDragEvent({type: "dragenter"}, 2);
    assert.ok(instance.state.topSitesPreview);
    assert.deepEqual(instance.state.topSitesPreview[2], site);
  });
  it("should _makeTopSitesPreview correctly", () => {
    const site1 = {url: "https://foo.com"};
    const site2 = {url: "https://bar.com"};
    const site3 = {url: "https://baz.com"};
    const rows = [site1, site2, site3];
    let wrapper = shallow(<TopSiteList {...DEFAULT_PROPS} TopSites={{rows}} />);
    let instance = wrapper.instance();
    instance.setState({
      draggedIndex: 0,
      draggedSite: site1,
      draggedTitle: "foo"
    });
    site1.isPinned = true;
    assert.deepEqual(instance._makeTopSitesPreview(1), [site2, site1, site3, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(2), [site2, site3, site1, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(3), [site2, site3, null, site1, null, null]);
    site2.isPinned = true;
    assert.deepEqual(instance._makeTopSitesPreview(1), [site2, site1, site3, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(2), [site3, site2, site1, null, null, null]);
    site3.isPinned = true;
    assert.deepEqual(instance._makeTopSitesPreview(1), [site2, site1, site3, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(2), [site2, site3, site1, null, null, null]);
    site2.isPinned = false;
    assert.deepEqual(instance._makeTopSitesPreview(1), [site2, site1, site3, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(2), [site2, site3, site1, null, null, null]);
    site3.isPinned = false;
    site1.isPinned = false;
    instance.setState({
      draggedIndex: 1,
      draggedSite: site2,
      draggedTitle: "bar"
    });
    site2.isPinned = true;
    assert.deepEqual(instance._makeTopSitesPreview(0), [site2, site1, site3, null, null, null]);
    assert.deepEqual(instance._makeTopSitesPreview(2), [site1, site3, site2, null, null, null]);
  });
});
