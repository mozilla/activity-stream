const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: Sections, Section} = require("content-src/components/Sections/Sections");

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
