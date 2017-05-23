const {AutoMigrateFeed} = require("lib/AutoMigrateFeed.jsm");
const {GlobalOverrider} = require("test/unit/utils");
const {actionTypes: at} = require("common/Actions.jsm");

describe("AutoMigrateFeed", () => {
  let globals;
  let sandbox;
  let feed;
  let _target = {browser: {ownerGlobal: {}}};
  beforeEach(() => {
    globals = new GlobalOverrider();
    globals.set("AutoMigrate", {
      keepAutoMigration: globals.sandbox.stub(),
      shouldShowMigratePrompt: globals.sandbox.stub().resolves(true),
      undoAutoMigration: globals.sandbox.stub()
    });

    sandbox = globals.sandbox;
    sandbox.spy(global.Components.utils, "reportError");

    feed = new AutoMigrateFeed();
    feed.store = {dispatch: sinon.spy()};
  });
  afterEach(() => globals.restore());

  describe("#onAction", () => {
    it("should call shouldShowMigratePrompt when new tab is visible", () => {
      feed.onAction({
        type: at.NEW_TAB_VISIBLE,
        _target
      });

      assert.calledOnce(global.AutoMigrate.shouldShowMigratePrompt);
    });

    it("should keep the migration when received MIGRATE_DONE action", () => {
      feed.onAction({
        type: at.AUTOMIGRATE_MIGRATE_DONE,
        _target
      });

      assert.calledOnce(global.AutoMigrate.keepAutoMigration);
      assert.calledOnce(feed.store.dispatch);
    });

    it("should undo the migration when received UNDO_MIGRATION action", () => {
      feed.onAction({
        type: at.AUTOMIGRATE_UNDO_MIGRATION,
        _target
      });

      assert.calledOnce(global.AutoMigrate.undoAutoMigration);
      assert.calledOnce(feed.store.dispatch);
    });
  });
});
