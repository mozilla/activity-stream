const {EditTopSites, TopSiteForm} = require("components/TopSites/TopSites");
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

describe("TopSiteForm", () => {
  let wrapper;

  function setup(props = {}) {
    const customProps = Object.assign({}, {onClose: sinon.spy(), dispatch: sinon.spy()}, props);
    wrapper = mountWithIntl(<TopSiteForm {...customProps} />, {context: {}, childContextTypes: {}});
  }

  describe("#addMode", () => {
    beforeEach(() => setup());

    it("should render the component", () => {
      assert.ok(wrapper.find(TopSiteForm));
    });

    it("should have an Add button", () => {
      assert.equal(1, wrapper.ref("addButton").length);
      // and it shouldn't have a save button.
      assert.equal(0, wrapper.ref("saveButton").length);
    });

    it("should call onClose if Cancel button is clicked", () => {
      wrapper.ref("cancelButton").simulate("click");
      assert.calledOnce(wrapper.prop("onClose"));
    });

    it("should not call onClose or dispatch if URL is empty", () => {
      wrapper.ref("addButton").simulate("click");
      assert.notCalled(wrapper.prop("onClose"));
      assert.notCalled(wrapper.prop("dispatch"));
    });

    it("should not call onClose or dispatch if URL is invalid", () => {
      wrapper.setState({"url": "invalid"});
      wrapper.ref("addButton").simulate("click");
      assert.notCalled(wrapper.prop("onClose"));
      assert.notCalled(wrapper.prop("dispatch"));
    });

    it("should call onClose and dispatch with right args if URL is valid", () => {
      wrapper.setState({"url": "valid.com", "title": "a title"});
      wrapper.ref("addButton").simulate("click");
      assert.calledOnce(wrapper.prop("onClose"));
      assert.calledWith(
        wrapper.prop("dispatch"),
        {
          data: {title: "a title", url: "http://valid.com"},
          meta: {broadcast: "content-to-addon", expect: "TOP_FRECENT_SITES_RESPONSE"},
          type: "TOPSITES_ADD_REQUEST"
        }
      );
      assert.calledWith(
        wrapper.prop("dispatch"),
        {
          data: {source: "TOP_SITES", event: "ADD_TOPSITE"},
          meta: {broadcast: "content-to-addon"},
          type: "NOTIFY_USER_EVENT"
        }
      );
    });
  });

  describe("#editMode", () => {
    beforeEach(() => setup({editMode: true, url: "https://foo.bar", title: "baz", slotIndex: 7}));

    it("should render the component", () => {
      assert.ok(wrapper.find(TopSiteForm));
    });

    it("should have a Save button", () => {
      assert.equal(1, wrapper.ref("saveButton").length);
      // and it shouldn't have a add button.
      assert.equal(0, wrapper.ref("editButton").length);
    });

    it("should call onClose if Cancel button is clicked", () => {
      wrapper.ref("cancelButton").simulate("click");
      assert.calledOnce(wrapper.prop("onClose"));
    });

    it("should not call onClose or dispatch if URL is empty", () => {
      wrapper.setState({"url": ""});
      wrapper.ref("saveButton").simulate("click");
      assert.notCalled(wrapper.prop("onClose"));
      assert.notCalled(wrapper.prop("dispatch"));
    });

    it("should not call onClose or dispatch if URL is invalid", () => {
      wrapper.setState({"url": "invalid"});
      wrapper.ref("saveButton").simulate("click");
      assert.notCalled(wrapper.prop("onClose"));
      assert.notCalled(wrapper.prop("dispatch"));
    });

    it("should call onClose and dispatch with right args if URL is valid", () => {
      wrapper.ref("saveButton").simulate("click");
      assert.calledOnce(wrapper.prop("onClose"));
      assert.calledWith(
        wrapper.prop("dispatch"),
        {
          data: {title: "baz", url: "https://foo.bar", index: 7},
          meta: {broadcast: "content-to-addon", expect: "TOP_FRECENT_SITES_RESPONSE"},
          type: "TOPSITES_EDIT_REQUEST"
        }
      );
      assert.calledWith(
        wrapper.prop("dispatch"),
        {
          data: {action_position: 7, source: "TOP_SITES", event: "EDIT_TOPSITE"},
          meta: {broadcast: "content-to-addon"},
          type: "NOTIFY_USER_EVENT"
        }
      );
    });
  });

  it("should properly validate URLs", () => {
    setup();
    wrapper.setState({"url": "mozilla.org"});
    assert.ok(wrapper.instance().validateUrl());
    wrapper.setState({"url": "https://mozilla.org"});
    assert.ok(wrapper.instance().validateUrl());
    wrapper.setState({"url": "http://mozilla.org"});
    assert.ok(wrapper.instance().validateUrl());
    wrapper.setState({"url": "mozillaorg"});
    assert.isFalse(wrapper.instance().validateUrl());
  });
});
