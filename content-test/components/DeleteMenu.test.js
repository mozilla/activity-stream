const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {renderWithProvider} = require("test/test-utils");
const DeleteMenu = require("components/DeleteMenu/DeleteMenu");

const DEFAULT_PROPS = {
  onUpdate: () => {},
  url: "https://foo.com",
  visible: false
};

// In the menu, the delete option is first,
// and the block option is second.
const DELETE_INDEX = 0;
const BLOCK_INDEX = 1;

describe("DeleteMenu", () => {
  let instance;
  let el;
  let blockLink;
  let deleteLink;

  function setup(custom = {}, customProvider = {}) {
    const props = Object.assign({}, DEFAULT_PROPS, custom);
    instance = renderWithProvider(<DeleteMenu {...props} />, customProvider);
    const links = TestUtils.scryRenderedDOMComponentsWithClass(instance, "context-menu-link");
    blockLink = links[BLOCK_INDEX];
    deleteLink = links[DELETE_INDEX];
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(setup);

  it("should render the component", () => {
    TestUtils.isCompositeComponentWithType(instance, DeleteMenu);
  });
  it("should be hidden by default", () => {
    assert.equal(el.hidden, true);
  });
  it("should be visible if props.visible is true", () => {
    setup({visible: true});
    assert.equal(el.hidden, false);
  });
  it("should have two links", () => {
    const links = TestUtils.scryRenderedDOMComponentsWithClass(instance, "context-menu-link");
    assert.lengthOf(links, 2);
  });
  it("should fire a delete event when Remove from History is clicked", done => {
    setup(null, {
      dispatch(a) {
        if (a.type === "NOTIFY_HISTORY_DELETE") {
          assert.equal(a.data, DEFAULT_PROPS.url);
          done();
        }
      }
    });
    assert.equal(deleteLink.innerHTML, "Remove from History");
    TestUtils.Simulate.click(deleteLink);
  });
  it("should fire a user event for Remove from History", done => {
    setup({
      page: "NEW_TAB",
      source: "FEATURED",
      index: 3
    }, {
      dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "DELETE");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 3);
          done();
        }
      }
    });
    TestUtils.Simulate.click(deleteLink);
  });
  it("should fire a block event when Never show on this page is clicked", done => {
    setup(null, {
      dispatch(a) {
        if (a.type === "NOTIFY_BLOCK_URL") {
          assert.equal(a.data, DEFAULT_PROPS.url);
          done();
        }
      }
    });
    assert.equal(blockLink.innerHTML, "Never show on this page");
    TestUtils.Simulate.click(blockLink);
  });
  it("should fire a user event for Never show on this page", done => {
    setup({
      page: "NEW_TAB",
      source: "FEATURED",
      index: 2
    }, {
      dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "BLOCK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 2);
          done();
        }
      }
    });
    TestUtils.Simulate.click(blockLink);
  });

});
