const {EditTopSites} = require("components/TopSites/TopSites");
const React = require("react");
const {mountWithIntl} = require("test/test-utils");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");

const DEFAULT_PROPS = {
  length: TOP_SITES_DEFAULT_LENGTH,
  page: "NEW_TAB",
  sites: [
    {
      url: "http://foo.com",
      title: "foo",
      favicon_url: "http://foo.com/favicon.ico"
    },
    {url: "http://bar.com"}
  ]
};

describe("EditTopSites", () => {
  let wrapper;
  function setup(props = {}) {
    const customProps = Object.assign({}, DEFAULT_PROPS, props);
    wrapper = mountWithIntl(<EditTopSites {...customProps} />, {context: {}, childContextTypes: {}});
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    assert.ok(wrapper.find(EditTopSites));
  });

  it("the modal should be hidden by default", () => {
    assert.equal(0, wrapper.ref("modal").length);
  });

  it("the modal should be shown when edit button is clicked", () => {
    wrapper.ref("editButton").simulate("click");
    assert.equal(1, wrapper.ref("modal").length);
  });

  it("the 'Show more' button should be shown by default", () => {
    wrapper.ref("editButton").simulate("click");
    assert.equal(1, wrapper.ref("showMoreButton").length);
    assert.equal(0, wrapper.ref("showLessButton").length);
  });

  it("the 'Show less' button should if we are showing 2 rows", () => {
    setup({length: TOP_SITES_SHOWMORE_LENGTH});
    wrapper.ref("editButton").simulate("click");
    assert.equal(0, wrapper.ref("showMoreButton").length);
    assert.equal(1, wrapper.ref("showLessButton").length);
  });

  it("the modal should be closed when done button is clicked", () => {
    wrapper.ref("editButton").simulate("click");
    assert.equal(1, wrapper.ref("modal").length);
    wrapper.ref("doneButton").simulate("click");
    assert.equal(0, wrapper.ref("modal").length);
  });
});
