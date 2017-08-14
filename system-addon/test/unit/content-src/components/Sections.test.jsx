const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl} = require("test/unit/utils");
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
      rows: []
    }));
    wrapper = shallow(<Sections Sections={FAKE_SECTIONS} />);
  });
  it("should render a Sections element", () => {
    assert.ok(wrapper.exists());
  });
  it("should render a Section for each one passed in props.Sections", () => {
    const sectionElems = wrapper.find(SectionIntl);
    assert.lengthOf(sectionElems, 5);
    sectionElems.forEach((section, i) => assert.equal(section.props().id, FAKE_SECTIONS[i].id));
  });
});

describe("<Section>", () => {
  const FAKE_SECTION = {
    id: `foo_bar_1`,
    title: `Foo Bar 1`,
    rows: [{link: "http://localhost", index: 0}],
    infoOption: {}
  };

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

  it("should send impression stats for topstories", () => {
    const FAKE_TOPSTORIES_SECTION = {
      id: "TopStories",
      title: "Foo Bar 1",
      maxRows: 1,
      rows: [{guid: 1}, {guid: 2}],
      infoOption: {}
    };

    const dispatch = sinon.spy();
    shallowWithIntl(<Section {...FAKE_TOPSTORIES_SECTION} dispatch={dispatch} eventSource={"TOP_STORIES"} />);
    assert.calledOnce(dispatch);

    const action = dispatch.firstCall.args[0];
    assert.equal(action.type, at.TELEMETRY_IMPRESSION_STATS);
    assert.equal(action.data.source, "TOP_STORIES");
    assert.deepEqual(action.data.tiles, [{id: 1}, {id: 2}]);
  });
});
