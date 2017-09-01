const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl, mountWithIntl} = require("test/unit/utils");
const {_unconnected: Sections, _unconnectedSection: Section, SectionIntl} =
  require("content-src/components/Sections/Sections");
const {PlaceholderCard} = require("content-src/components/Card/Card");
const {actionTypes: at} = require("common/Actions.jsm");

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
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} />);
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
});

describe("<Section>", () => {
  let wrapper;
  let FAKE_SECTION;

  beforeEach(() => {
    FAKE_SECTION = {
      id: `foo_bar_1`,
      title: `Foo Bar 1`,
      rows: [{link: "http://localhost", index: 0}],
      infoOption: {},
      emptyState: {
        icon: "check",
        message: "Some message"
      }
    };
    wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
  });

  describe("icon", () => {
    it("should use the icon prop value as the url if it starts with `moz-extension://`", () => {
      Object.assign(FAKE_SECTION, {icon: "moz-extension://some/extension/path"});
      wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
      const props = wrapper.find(".icon").first().props();
      assert.equal(props.style["background-image"], `url('${FAKE_SECTION.icon}')`);
    });
    it("should use the icon `webextension` if no other is provided", () => {
      assert.ok(wrapper.find(".icon").first().hasClass("icon-webextension"));
    });
  });

  describe("placeholders", () => {
    const CARDS_PER_ROW = 3;
    const fakeSite = {link: "http://localhost"};
    function renderWithSites(rows) {
      return shallowWithIntl(<Section {...FAKE_SECTION} rows={rows} maxRows={2} />);
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
      wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
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
      wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
      assert.isFalse(wrapper.find(".empty-state").exists());
    });
    it("should use the icon prop as the icon url if it starts with `moz-extension://`", () => {
      const props = wrapper.find(".empty-state-icon").first().props();
      assert.equal(props.style["background-image"], `url('${FAKE_SECTION.emptyState.icon}')`);
    });
  });

  describe("info option", () => {
    it("should render info-option-icon with a tabindex", () => {
      // Because this is a shallow render, we need to use the casing
      // that react understands (tabIndex), rather than the one used by
      // the browser itself (tabindex).
      assert.lengthOf(wrapper.find(".info-option-icon[tabIndex]"), 1);
    });

    it("should render info-option-icon with a role of 'note'", () => {
      assert.lengthOf(wrapper.find('.info-option-icon[role="note"]'), 1);
    });

    it("should render info-option-icon with a title attribute", () => {
      assert.lengthOf(wrapper.find(".info-option-icon[title]"), 1);
    });

    it("should render info-option-icon with aria-haspopup", () => {
      assert.lengthOf(wrapper.find('.info-option-icon[aria-haspopup="true"]'),
        1);
    });

    it('should render info-option-icon with aria-controls="info-option"', () => {
      assert.lengthOf(
        wrapper.find('.info-option-icon[aria-controls="info-option"]'), 1);
    });

    it('should render info-option-icon aria-expanded["false"] by default', () => {
      assert.lengthOf(wrapper.find('.info-option-icon[aria-expanded="false"]'),
        1);
    });

    it("should render info-option-icon w/aria-expanded when moused over", () => {
      wrapper.find(".section-info-option").simulate("mouseover");

      assert.lengthOf(wrapper.find('.info-option-icon[aria-expanded="true"]'), 1);
    });

    it('should render info-option-icon w/aria-expanded["false"] when moused out', () => {
      wrapper.find(".section-info-option").simulate("mouseover");

      wrapper.find(".section-info-option").simulate("mouseout");

      assert.lengthOf(wrapper.find('.info-option-icon[aria-expanded="false"]'), 1);
    });

    it("should render topics component for non-empty topics", () => {
      let TOP_STORIES_SECTION = {
        id: "topstories",
        title: "TopStories",
        rows: [{guid: 1, link: "http://localhost", isDefault: true}],
        topics: [],
        read_more_endpoint: "http://localhost/read-more",
        maxRows: 1,
        eventSource: "TOP_STORIES"
      };
      wrapper = mountWithIntl(<Section {...TOP_STORIES_SECTION} />);
      assert.lengthOf(wrapper.find(".topic"), 0);

      TOP_STORIES_SECTION.topics = [{name: "topic1", url: "topic-url1"}];
      wrapper = mountWithIntl(<Section {...TOP_STORIES_SECTION} />);
      assert.lengthOf(wrapper.find(".topic"), 1);
    });
  });

  describe("impression stats", () => {
    const FAKE_TOPSTORIES_SECTION_PROPS = {
      id: "TopStories",
      title: "Foo Bar 1",
      maxRows: 1,
      rows: [{guid: 1}, {guid: 2}],
      infoOption: {id: "foo"},

      document: {
        visibilityState: "visible",
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub()
      },
      eventSource: "TOP_STORIES",
      options: {personalized: false}
    };

    function renderSection(props = {}) {
      return shallowWithIntl(<Section
        {...FAKE_TOPSTORIES_SECTION_PROPS}
        {...props} />, {lifecycleExperimental: true});
    }

    it("should send impression with the right stats when the page loads", () => {
      const dispatch = sinon.spy();
      renderSection({dispatch});

      assert.calledOnce(dispatch);

      const action = dispatch.firstCall.args[0];
      assert.equal(action.type, at.TELEMETRY_IMPRESSION_STATS);
      assert.equal(action.data.source, "TOP_STORIES");
      assert.isFalse(action.data.incognito);
      assert.deepEqual(action.data.tiles, [{id: 1}, {id: 2}]);
    });
    it("should not send client id if section is personalized", () => {
      FAKE_TOPSTORIES_SECTION_PROPS.options.personalized = true;
      const dispatch = sinon.spy();
      renderSection({dispatch});

      assert.calledOnce(dispatch);

      const action = dispatch.firstCall.args[0];
      assert.equal(action.type, at.TELEMETRY_IMPRESSION_STATS);
      assert.equal(action.data.source, "TOP_STORIES");
      assert.isTrue(action.data.incognito);
      assert.deepEqual(action.data.tiles, [{id: 1}, {id: 2}]);
    });
    it("should send 1 impression when the page becomes visibile after loading", () => {
      const props = {
        dispatch: sinon.spy(),
        document: {
          visibilityState: "hidden",
          addEventListener: sinon.spy(),
          removeEventListener: sinon.spy()
        }
      };

      renderSection(props);

      // Was the event listener added?
      assert.calledWith(props.document.addEventListener, "visibilitychange");

      // Make sure dispatch wasn't called yet
      assert.notCalled(props.dispatch);

      // Simulate a visibilityChange event
      const listener = props.document.addEventListener.firstCall.args[1];
      props.document.visibilityState = "visible";
      listener();

      // Did we actually dispatch an event?
      assert.calledOnce(props.dispatch);
      assert.equal(props.dispatch.firstCall.args[0].type, at.TELEMETRY_IMPRESSION_STATS);

      // Did we remove the event listener?
      assert.calledWith(props.document.removeEventListener, "visibilitychange", listener);
    });
    it("should send an impression if props are updated and props.rows are different", () => {
      const props = {dispatch: sinon.spy()};
      wrapper = renderSection(props);
      props.dispatch.reset();

      // New rows
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {rows: [{guid: 123}]}
      ));

      assert.calledOnce(props.dispatch);
    });
    it("should not send an impression if props are updated but props.rows are the same", () => {
      const props = {dispatch: sinon.spy()};
      wrapper = renderSection(props);
      props.dispatch.reset();

      // Only update the infoOption prop
      wrapper.setProps(Object.assign({},
        FAKE_TOPSTORIES_SECTION_PROPS,
        {infoOption: {id: "bar"}}
      ));

      assert.notCalled(props.dispatch);
    });
    it("should only send the latest impression on a visibility change", () => {
      const listeners = new Set();
      const props = {
        dispatch: sinon.spy(),
        document: {
          visibilityState: "hidden",
          addEventListener: (ev, cb) => listeners.add(cb),
          removeEventListener: (ev, cb) => listeners.delete(cb)
        }
      };

      wrapper = renderSection(props);

      // Update twice
      wrapper.setProps(Object.assign({}, props,
        {rows: [{guid: 123}]}
      ));
      wrapper.setProps(Object.assign({}, props,
        {rows: [{guid: 2432}]}
      ));

      assert.notCalled(props.dispatch);

      // Simulate listeners getting called
      props.document.visibilityState = "visible";
      listeners.forEach(l => l());

      // Make sure we only sent the latest event
      assert.calledOnce(props.dispatch);
      const action = props.dispatch.firstCall.args[0];
      assert.deepEqual(action.data.tiles, [{id: 2432}]);
    });
  });
});
