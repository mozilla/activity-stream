const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: Sections, Section} = require("content-src/components/Sections/Sections");
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
    wrapper = shallowWithIntl(<Sections Sections={FAKE_SECTIONS} />);
  });
  it("should render a Sections element", () => {
    assert.ok(wrapper.exists());
  });
  it("should render a Section for each one passed in props.Sections", () => {
    const sectionElems = wrapper.find(Section);
    assert.lengthOf(sectionElems, 5);
    sectionElems.forEach((section, i) => assert.equal(section.props().id, FAKE_SECTIONS[i].id));
  });
});

describe("<Section>", () => {
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
