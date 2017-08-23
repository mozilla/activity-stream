const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl, mountWithIntl} = require("test/unit/utils");
const {_unconnected: Sections, _unconnectedSection: Section, SectionIntl} =
  require("content-src/components/Sections/Sections");
const {actionTypes: at} = require("common/Actions.jsm");

describe("<Sections>", () => {
  let wrapper;
  let FAKE_SECTIONS;
  beforeEach(() => {
    FAKE_SECTIONS = new Array(5).fill(null).map((v, i) => ({
      id: `foo_bar_${i}`,
      title: `Foo Bar ${i}`,
      initialized: false,
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

const FAKE_SECTION = {
  id: `foo_bar_1`,
  title: `Foo Bar 1`,
  rows: [{link: "http://localhost", index: 0}],
  infoOption: {}
};

describe("<Section>", () => {
  it("should use the icon `webextension` if no other is provided", () => {
    const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
    assert.ok(wrapper.find(".icon").first().hasClass("icon-webextension"));
  });

  describe("info option", () => {
    it("should render info-option-icon with a tabindex", () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      // Because this is a shallow render, we need to use the casing
      // that react understands (tabIndex), rather than the one used by
      // the browser itself (tabindex).
      assert.lengthOf(wrapper.find(".info-option-icon[tabIndex]"), 1);
    });

    it("should render info-option-icon with a role of 'note'", () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      assert.lengthOf(wrapper.find('.info-option-icon[role="note"]'), 1);
    });

    it("should render info-option-icon with a title attribute", () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      assert.lengthOf(wrapper.find(".info-option-icon[title]"), 1);
    });

    it("should render info-option-icon with aria-haspopup", () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      assert.lengthOf(wrapper.find('.info-option-icon[aria-haspopup="true"]'),
        1);
    });

    it('should render info-option-icon with aria-controls="info-option"', () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      assert.lengthOf(
        wrapper.find('.info-option-icon[aria-controls="info-option"]'), 1);
    });

    it('should render info-option-icon aria-expanded["false"] by default', () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      assert.lengthOf(wrapper.find('.info-option-icon[aria-expanded="false"]'),
        1);
    });

    it("should render info-option-icon w/aria-expanded when moused over", () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);

      wrapper.find(".section-info-option").simulate("mouseover");

      assert.lengthOf(wrapper.find('.info-option-icon[aria-expanded="true"]'), 1);
    });

    it('should render info-option-icon w/aria-expanded["false"] when moused out', () => {
      const wrapper = shallowWithIntl(<Section {...FAKE_SECTION} />);
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
      let wrapper = mountWithIntl(<Section {...TOP_STORIES_SECTION} />);
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
      eventSource: "TOP_STORIES"
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
      const wrapper = renderSection(props);
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
      const wrapper = renderSection(props);
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

      const wrapper = renderSection(props);

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
