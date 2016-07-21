const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const {renderWithProvider} = require("test/test-utils");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

const DEFAULT_PROPS = {
  onUpdate: () => {},
  site: {
    url: "https://foo.com"
  },
  page: "NEW_TAB",
  source: "ACTIVITY_FEED",
  index: 3
};

describe("LinkMenu", () => {
  let instance;
  let contextMenu;

  function setup(custom = {}, customProvider = {}) {
    const props = Object.assign({}, DEFAULT_PROPS, custom);
    instance = renderWithProvider(<LinkMenu {...props} />, customProvider);
    contextMenu = TestUtils.findRenderedComponentWithType(instance, ContextMenu);
  }

  beforeEach(setup);

  it("should render a ContextMenu", () => {
    assert.ok(contextMenu);
  });

  it("should pass visible, onUpdate props to ContextMenu", () => {
    const onUpdate = () => {};
    setup({visible: true, onUpdate});
    assert.isTrue(contextMenu.props.visible, "visible");
    assert.equal(contextMenu.props.onUpdate, onUpdate, "onUpdate");
  });

  it("should show 'Add Bookmark' and hide 'Remove Bookmark' for a non-bookmark", () => {
    assert.ok(contextMenu.refs.addBookmark, "show addBoomark");
    assert.isUndefined(contextMenu.refs.removeBookmark, "hide removeBookmark");
  });

  it("should hide 'Add Bookmark' and show 'Remove Bookmark' for a bookmark", () => {
    setup({site: {url: "https://foo.com", bookmarkGuid: "asdasd23123"}});
    assert.isUndefined(contextMenu.refs.addBookmark, "hide addBoomark");
    assert.ok(contextMenu.refs.removeBookmark, "show removeBookmark");
  });

  it("should hide delete options for FIRST_RUN_TYPE", () => {
    setup({site: {url: "https://foo.com", type: FIRST_RUN_TYPE}});
    assert.isUndefined(contextMenu.refs.dismiss, "hide dismiss");
    assert.isUndefined(contextMenu.refs.delete, "hide delete");
    assert.lengthOf(contextMenu.props.options, 4);
  });

  it("should hide delete options for bookmarks page", () => {
    setup({site: {url: "https://foo.com"}, page: "TIMELINE_BOOKMARKS"});
    assert.isUndefined(contextMenu.refs.dismiss, "hide dismiss");
    assert.isUndefined(contextMenu.refs.delete, "hide delete");
    assert.lengthOf(contextMenu.props.options, 4);
  });

  it("should hide delete from history option for recommendation", () => {
    setup({site: {url: "https://foo.com", recommended: true}});
    assert.isUndefined(contextMenu.refs.delete, "hide delete");
  });

  it("should hide dismiss option if allowBlock is false", () => {
    setup({allowBlock: false});
    assert.isUndefined(contextMenu.refs.dismiss, "hide dismiss");
  });

  describe("individual options", () => {
    // Checks to make sure each action
    // 1. Fires a custom action (options.event)
    // 2. Has the right event data (options.eventData)
    // 3. Fires a NOTIFY_USER_EVENT with type options.userEvent
    // When options.ref is clicked
    function checkOption(options) {
      it(`should ${options.ref}`, done => {
        let count = 0;
        setup(options.props || {}, {dispatch(action) {
          if (action.type === options.event) {
            assert.deepEqual(action.data, options.eventData, "event data");
            count++;
          }
          if (action.type === "NOTIFY_USER_EVENT") {
            assert.equal(action.data.event, options.userEvent);
            assert.equal(action.data.page, DEFAULT_PROPS.page);
            assert.equal(action.data.source, DEFAULT_PROPS.source);
            assert.equal(action.data.action_position, DEFAULT_PROPS.index);
            count++;
          }
          if (count === 2) {
            done();
          }
        }});
        TestUtils.Simulate.click(contextMenu.refs[options.ref]);
      });
    }
    checkOption({
      ref: "removeBookmark",
      props: {site: {url: "https://foo.com", bookmarkGuid: "foo123"}},
      event: "NOTIFY_BOOKMARK_DELETE",
      eventData: "foo123",
      userEvent: "BOOKMARK_DELETE"
    });
    checkOption({
      ref: "addBookmark",
      event: "NOTIFY_BOOKMARK_ADD",
      eventData: DEFAULT_PROPS.site.url,
      userEvent: "BOOKMARK_ADD"
    });
    checkOption({
      ref: "openWindow",
      event: "NOTIFY_OPEN_WINDOW",
      eventData: {url: DEFAULT_PROPS.site.url},
      userEvent: "OPEN_NEW_WINDOW"
    });
    checkOption({
      ref: "openPrivate",
      event: "NOTIFY_OPEN_WINDOW",
      eventData: {url: DEFAULT_PROPS.site.url, isPrivate: true},
      userEvent: "OPEN_PRIVATE_WINDOW"
    });
    checkOption({
      ref: "dismiss",
      event: "NOTIFY_BLOCK_URL",
      eventData: DEFAULT_PROPS.site.url,
      userEvent: "BLOCK"
    });
    checkOption({
      ref: "delete",
      event: "NOTIFY_HISTORY_DELETE",
      eventData: DEFAULT_PROPS.site.url,
      userEvent: "DELETE"
    });
  });

  describe("dismiss recommendation", () => {
    function checkBlockRecommendation(options) {
      it(`should ${options.ref} recommendation`, done => {
        let count = 0;
        setup({site: {url: "https://foo.com", recommended: true}}, {dispatch(action) {
          if (action.type === options.event) {
            assert.deepEqual(action.data, options.eventData, "event data");
            count++;
          }
          if (action.type === "NOTIFY_USER_EVENT") {
            assert.equal(action.data.event, options.userEvent);
            assert.equal(action.data.page, DEFAULT_PROPS.page);
            assert.equal(action.data.source, DEFAULT_PROPS.source);
            assert.equal(action.data.action_position, DEFAULT_PROPS.index);
            count++;
          }
          if (count === 2) {
            done();
          }
        }});
        TestUtils.Simulate.click(contextMenu.refs[options.ref]);
      });
    }
    checkBlockRecommendation({
      ref: "dismiss",
      event: "NOTIFY_BLOCK_RECOMMENDATION",
      eventData: DEFAULT_PROPS.site.url,
      userEvent: "BLOCK"
    });
  });
});
