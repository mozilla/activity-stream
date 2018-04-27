import {combineReducers, createStore} from "redux";
import {ImpressionsWrapper, VISIBILITY_CHANGE_EVENT, VISIBLE} from "content-src/components/Sections/ImpressionsWrapper.jsx";
import {INITIAL_STATE, reducers} from "common/Reducers.jsm";
import {mountWithIntl, shallowWithIntl} from "test/unit/utils";
import {Section, SectionIntl, _Sections as Sections} from "content-src/components/Sections/Sections";
import {actionTypes as at} from "common/Actions.jsm";
import {PlaceholderCard} from "content-src/components/Card/Card";
import {Provider} from "react-redux";
import React from "react";
import {SectionMenu} from "content-src/components/SectionMenu/SectionMenu";
import {shallow} from "enzyme";
import {TopSites} from "content-src/components/TopSites/TopSites";

function mountSectionWithProps(props) {
  const store = createStore(combineReducers(reducers), INITIAL_STATE);
  return mountWithIntl(<Provider store={store}><Section {...props} /></Provider>);
}

describe("<Sections>", () => {
  let wrapper;
  let FAKE_SECTIONS;
  beforeEach(() => {
    FAKE_SECTIONS = new Array(5).fill(null).map((v, i) => ({
      id: `foo_bar_${i}`,
      title: `Foo Bar ${i}`,
      enabled: !!(i % 2),
      rows: []
    }));
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} Prefs={{values: {sectionOrder: FAKE_SECTIONS.map(i => i.id).join(",")}}} />);
  });
  it("should render a Sections element", () => {
    assert.ok(wrapper.exists());
  });
  it("should render a Section for each one passed in props.Sections with .enabled === true", () => {
    const sectionElems = wrapper.find(SectionIntl);
    assert.lengthOf(sectionElems, 2);
    sectionElems.forEach((section, i) => {
      assert.equal(section.props().id, FAKE_SECTIONS[2 * i + 1].id);
      assert.equal(section.props().enabled, true);
    });
  });
  it("should render Top Sites if feeds.topsites pref is true", () => {
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} Prefs={{values: {"feeds.topsites": true, "sectionOrder": "topsites,topstories,highlights"}}} />);
    assert.equal(wrapper.find(TopSites).length, 1);
  });
  it("should NOT render Top Sites if feeds.topsites pref is false", () => {
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} Prefs={{values: {"feeds.topsites": false, "sectionOrder": "topsites,topstories,highlights"}}} />);
    assert.equal(wrapper.find(TopSites).length, 0);
  });
  it("should render the sections in the order specifed by sectionOrder pref", () => {
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} Prefs={{values: {sectionOrder: "foo_bar_1,foo_bar_3"}}} />);
    let sections = wrapper.find(SectionIntl);
    assert.lengthOf(sections, 2);
    assert.equal(sections.first().props().id, "foo_bar_1");
    assert.equal(sections.last().props().id, "foo_bar_3");
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} Prefs={{values: {sectionOrder: "foo_bar_3,foo_bar_1"}}} />);
    sections = wrapper.find(SectionIntl);
    assert.lengthOf(sections, 2);
    assert.equal(sections.first().props().id, "foo_bar_3");
    assert.equal(sections.last().props().id, "foo_bar_1");
  });
});

describe("<Section>", () => {
  let wrapper;
  let FAKE_SECTION;

  beforeEach(() => {
    FAKE_SECTION = {
      id: `foo_bar_1`,
      pref: {collapsed: false},
      title: `Foo Bar 1`,
      rows: [{link: "http://localhost", index: 0}],
      emptyState: {
        icon: "check",
        message: "Some message"
      }
    };
    wrapper = mountSectionWithProps(FAKE_SECTION);
  });

  describe("context menu", () => {
    it("should render a context menu button", () => {
      wrapper = mountSectionWithProps(FAKE_SECTION);

      assert.equal(wrapper.find(".section-top-bar .context-menu-button").length, 1);
    });
    it("should render a section menu when button is clicked", () => {
      wrapper = mountSectionWithProps(FAKE_SECTION);

      const button = wrapper.find(".section-top-bar .context-menu-button");
      assert.equal(wrapper.find(SectionMenu).length, 0);
      button.simulate("click", {preventDefault: () => {}});
      assert.equal(wrapper.find(SectionMenu).length, 1);
    });
    it("should not render a section menu by default", () => {
      wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
      assert.equal(wrapper.find(SectionMenu).length, 0);
    });
  });

  describe("placeholders", () => {
    const CARDS_PER_ROW = 3;
    const fakeSite = {link: "http://localhost"};
    function renderWithSites(rows) {
      const store = createStore(combineReducers(reducers), INITIAL_STATE);
      return mountWithIntl(<Provider store={store}><Section {...FAKE_SECTION} rows={rows} maxRows={2} /></Provider>);
    }

    it("should return 1 row of placeholders if realRows is 0", () => {
      wrapper = renderWithSites([]);
      assert.lengthOf(wrapper.find(PlaceholderCard), 3);
    });
    it("should fill in the rest of the row", () => {
      wrapper = renderWithSites(new Array(CARDS_PER_ROW + 1).fill(fakeSite));
      assert.lengthOf(wrapper.find(PlaceholderCard), 2, "CARDS_PER_ROW + 1");

      wrapper = renderWithSites(new Array(CARDS_PER_ROW + 2).fill(fakeSite));
      assert.lengthOf(wrapper.find(PlaceholderCard), 1, "CARDS_PER_ROW + 2");

      wrapper = renderWithSites(new Array(2 * CARDS_PER_ROW - 1).fill(fakeSite));
      assert.lengthOf(wrapper.find(PlaceholderCard), 1, "CARDS_PER_ROW - 1");
    });
    it("should not add placeholders if a whole row is filled in", () => {
      wrapper = renderWithSites(new Array(CARDS_PER_ROW).fill(fakeSite));
      assert.lengthOf(wrapper.find(PlaceholderCard), 0, "1 row");

      wrapper = renderWithSites(new Array(2 * CARDS_PER_ROW).fill(fakeSite));
      assert.lengthOf(wrapper.find(PlaceholderCard), 0, "2 rows");
    });
  });

  describe("empty state", () => {
    beforeEach(() => {
      Object.assign(FAKE_SECTION, {
        initialized: true,
        rows: [],
        emptyState: {message: "Some message", icon: "moz-extension://some/extension/path"}
      });
      wrapper = shallowWithIntl(
        <Section {...FAKE_SECTION} />);
    });
    it("should be shown when rows is empty and initialized is true", () => {
      assert.ok(wrapper.find(".empty-state").exists());
    });
    it("should not be shown in initialized is false", () => {
      Object.assign(FAKE_SECTION, {
        initialized: false,
        rows: [],
        emptyState: {message: "Some message", icon: "moz-extension://some/extension/path"}
      });
      wrapper = shallowWithIntl(
        <Section {...FAKE_SECTION} />);
      assert.isFalse(wrapper.find(".empty-state").exists());
    });
    it("should use the icon prop as the icon url if it starts with `moz-extension://`", () => {
      const props = wrapper.find(".empty-state-icon").first().props();
      assert.equal(props.style["background-image"], `url('${FAKE_SECTION.emptyState.icon}')`);
    });
  });

  describe("topics component", () => {
    let TOP_STORIES_SECTION;
    beforeEach(() => {
      TOP_STORIES_SECTION = {
        id: "topstories",
        title: "TopStories",
        pref: {collapsed: false},
        rows: [{guid: 1, link: "http://localhost", isDefault: true}],
        topics: [],
        read_more_endpoint: "http://localhost/read-more",
        maxRows: 1,
        eventSource: "TOP_STORIES"
      };
    });
    it("should not render for empty topics", () => {
      wrapper = mountSectionWithProps(TOP_STORIES_SECTION);

      assert.lengthOf(wrapper.find(".topic"), 0);
    });
    it("should render for non-empty topics", () => {
      TOP_STORIES_SECTION.topics = [{name: "topic1", url: "topic-url1"}];

      wrapper = mountSectionWithProps(TOP_STORIES_SECTION);

      assert.lengthOf(wrapper.find(".topic"), 1);
    });
    it("should render for uninitialized topics", () => {
      delete TOP_STORIES_SECTION.topics;

      wrapper = mountSectionWithProps(TOP_STORIES_SECTION);

      assert.lengthOf(wrapper.find(".topic"), 1);
    });
  });

  describe("impression stats", () => {
    let FAKE_TOPSTORIES_SECTION_PROPS;
    let sandbox;
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      FAKE_TOPSTORIES_SECTION_PROPS = {
        id: "TopStories",
        title: "Foo Bar 1",
        pref: {collapsed: false},
        maxRows: 1,
        rows: [{guid: 1}, {guid: 2}],
        shouldSendImpressionStats: true,

        document: {
          visibilityState: "visible",
          addEventListener: sinon.stub(),
          removeEventListener: sinon.stub()
        },
        eventSource: "TOP_STORIES",
        options: {personalized: false}
      };
    });

    afterEach(() => {
      wrapper.unmount();
      sandbox.restore();
    });

    function renderSection(props = {}) {
      return shallowWithIntl(<Section
        {...FAKE_TOPSTORIES_SECTION_PROPS}
        {...props} />);
    }

    it("should send impression with the right stats when the page loads", () => {
      const dispatch = sinon.spy();
      wrapper = renderSection({dispatch});

      wrapper.instance().dispatchImpressionStats();
      assert.calledOnce(dispatch);

      const [action] = dispatch.firstCall.args;
      assert.equal(action.type, at.TELEMETRY_IMPRESSION_STATS);
      assert.equal(action.data.source, "TOP_STORIES");
      assert.deepEqual(action.data.tiles, [{id: 1}, {id: 2}]);
    });
    it("should not send impression stats if not configured", () => {
      const dispatch = sinon.spy();
      const props = Object.assign({}, FAKE_TOPSTORIES_SECTION_PROPS, {shouldSendImpressionStats: false, dispatch});
      wrapper = renderSection(props);
      assert.notCalled(dispatch);
    });
    it("should not send impression stats if the section is collapsed", () => {
      const dispatch = sinon.spy();
      const props = Object.assign({}, FAKE_TOPSTORIES_SECTION_PROPS, {pref: {collapsed: true}});
      wrapper = renderSection(props);
      assert.notCalled(dispatch);
    });
    it("should send an impression if props are updated and props.rows are different", () => {
      const props = {dispatch: sinon.spy()};
      wrapper = renderSection(props);
      props.dispatch.reset();

      wrapper.instance().componentDidUpdate = prevProps => {
        assert.isTrue(wrapper.instance().shouldSendImpressionsOnUpdate(prevProps));
      };

      // New rows
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {rows: [{guid: 123}]}
      ));
    });
    it("should not send an impression if props are updated and props.rows are the same but section is collapsed", () => {
      wrapper = renderSection();

      let prevProps = wrapper.props();

      // New rows and collapsed
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {
          rows: [{guid: 123}],
          pref: {collapsed: true}
        }
      ));

      assert.isFalse(wrapper.instance().shouldSendImpressionsOnUpdate(prevProps));
      prevProps = wrapper.props();

      // Expand the section. Now the impression stats should be sent
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {
          rows: [{guid: 123}],
          pref: {collapsed: false}
        }
      ));

      assert.isTrue(wrapper.instance().shouldSendImpressionsOnUpdate(prevProps));
    });
    it("should not send an impression if props are updated but GUIDs are the same", () => {
      const props = {dispatch: sinon.spy()};
      wrapper = renderSection(props);
      props.dispatch.reset();

      // Only update the disclaimer prop
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {disclaimer: {id: "bar"}}
      ));

      assert.notCalled(props.dispatch);
    });
  });
});

describe("<ImpressionsWrapper>", () => {
  let sandbox;
  let wrapper;
  let defaultProps;
  function setUp(props = {}) {
    return shallow(<ImpressionsWrapper {...props}><InnerEl /></ImpressionsWrapper>);
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.spy(ImpressionsWrapper.prototype, "sendImpressionStatsOrAddListener");
    defaultProps = {
      shouldSendImpressionsOnUpdate: sandbox.stub(),
      dispatchImpressionStats: sandbox.stub(),
      document: {
        removeEventListener: sandbox.stub(),
        addEventListener: sandbox.stub()
      }
    };
    wrapper = setUp(defaultProps);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const InnerEl = () => (<div>Inner Element</div>);

  it("should render props.children", () => {
    assert.ok(wrapper.contains(<InnerEl />));
  });

  it("should call sendImpressionStatsOrAddListener on mount if prop is true", () => {
    wrapper.setProps({sendOnMount: true});

    wrapper.instance().componentDidMount();

    assert.calledOnce(wrapper.instance().sendImpressionStatsOrAddListener);
  });

  it("should not call sendImpressionStatsOrAddListener on mount if prop is false", () => {
    wrapper.setProps({sendOnMount: false});

    wrapper.instance().componentDidMount();

    assert.notCalled(wrapper.instance().sendImpressionStatsOrAddListener);
  });

  it("should call sendImpressionStatsOrAddListener only once for multiple updates", () => {
    const prevProps = {};
    defaultProps.shouldSendImpressionsOnUpdate.returns(true);

    // Multiple updates
    wrapper.instance().componentDidUpdate(prevProps);
    wrapper.instance().componentDidUpdate(prevProps);
    wrapper.instance().componentDidUpdate(prevProps);
    wrapper.setProps({document: Object.assign(defaultProps.document, {visibilityState: VISIBLE})});

    assert.calledOnce(defaultProps.dispatchImpressionStats);
  });

  it("should call sendImpressionStatsOrAddListener on update if fn returns true", () => {
    const prevProps = {};
    defaultProps.shouldSendImpressionsOnUpdate.returns(true);

    wrapper.instance().componentDidUpdate(prevProps);

    assert.calledWithExactly(defaultProps.shouldSendImpressionsOnUpdate, prevProps);
    assert.calledOnce(wrapper.instance().sendImpressionStatsOrAddListener);
  });

  it("should not call sendImpressionStatsOrAddListener on update if fn returns false", () => {
    defaultProps.shouldSendImpressionsOnUpdate.returns(false);

    wrapper.instance().componentDidUpdate({});

    assert.calledOnce(defaultProps.shouldSendImpressionsOnUpdate);
    assert.notCalled(wrapper.instance().sendImpressionStatsOrAddListener);
  });

  it("should remove event listener on unmount", () => {
    wrapper.instance()._onVisibilityChange = () => {};

    wrapper.instance().componentWillUnmount();

    assert.calledOnce(defaultProps.document.removeEventListener);
    assert.calledWithExactly(defaultProps.document.removeEventListener, VISIBILITY_CHANGE_EVENT, wrapper.instance()._onVisibilityChange);
  });

  describe("#sendImpressionStatsOrAddListener", () => {
    it("should add an event listener if the visibilityState is not VISIBLE", () => {
      wrapper.setProps({shouldSendImpressionStats: true});

      wrapper.instance().sendImpressionStatsOrAddListener();

      assert.calledOnce(defaultProps.document.addEventListener);
      assert.calledWithExactly(defaultProps.document.addEventListener, VISIBILITY_CHANGE_EVENT, wrapper.instance()._onVisibilityChange);
    });

    it("should add an event listener if the visibilityState is not VISIBLE", () => {
      wrapper.instance()._onVisibilityChange = () => {};

      wrapper.instance().sendImpressionStatsOrAddListener();

      assert.calledOnce(defaultProps.document.removeEventListener);
      assert.calledWithExactly(defaultProps.document.removeEventListener, VISIBILITY_CHANGE_EVENT, sinon.match.func);
    });

    it("should dispatch impression if visibilityState is VISIBLE", () => {
      wrapper.setProps({document: Object.assign(defaultProps.document, {visibilityState: VISIBLE})});

      wrapper.instance().sendImpressionStatsOrAddListener();

      assert.calledOnce(defaultProps.dispatchImpressionStats);
      assert.notCalled(defaultProps.document.addEventListener);
    });

    it("should not dispatch impression if visiblity is not VISIBLE", () => {
      wrapper.instance().sendImpressionStatsOrAddListener();

      // Call the addEventListener cb;
      defaultProps.document.addEventListener.args[0][1]();

      assert.notCalled(defaultProps.dispatchImpressionStats);
      assert.notCalled(defaultProps.document.removeEventListener);
    });

    it("should dispatch impression if visiblity is VISIBLE", () => {
      wrapper.instance().sendImpressionStatsOrAddListener();

      wrapper.setProps({document: Object.assign(defaultProps.document, {visibilityState: VISIBLE})});

      // Call the addEventListener cb;
      defaultProps.document.addEventListener.args[0][1]();

      assert.calledOnce(defaultProps.dispatchImpressionStats);
      assert.calledOnce(defaultProps.document.removeEventListener);
      assert.calledWithExactly(defaultProps.document.removeEventListener, VISIBILITY_CHANGE_EVENT, wrapper.instance()._onVisibilityChange);
    });

    it("should send 1 impression when the page becomes visible after loading", () => {
      defaultProps = Object.assign({}, defaultProps, {sendOnMount: true});
      wrapper = setUp(defaultProps);

      assert.calledOnce(defaultProps.document.addEventListener);
      assert.calledWithExactly(defaultProps.document.addEventListener, VISIBILITY_CHANGE_EVENT, sinon.match.func);

      // because document visibility is hidden
      assert.notCalled(defaultProps.dispatchImpressionStats);

      const [, listener] = defaultProps.document.addEventListener.firstCall.args;
      wrapper.setProps({document: Object.assign(defaultProps.document, {visibilityState: VISIBLE})});
      listener();

      assert.calledOnce(defaultProps.dispatchImpressionStats);
      assert.calledWithExactly(defaultProps.document.removeEventListener, VISIBILITY_CHANGE_EVENT, listener);
    });
  });
});
