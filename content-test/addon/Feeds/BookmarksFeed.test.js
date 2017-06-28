const {BOOKMARKS_LENGTH} = require("common/constants");
const moment = require("moment");
const testLinks = [{url: "foo.com", hostname: "foo.com"},
  {url: "bar.com", hostname: "bar.com"}];
const getCachedMetadata = links => links.map(
  link => {
    link.hasMetadata = true;
    return link;
  }
);
const PlacesProvider = {links: {getBookmarks: sinon.spy(() => Promise.resolve(testLinks))}};
const testScreenshot = "screenshot.jpg";

const createStoreWithState = state => ({
  state,
  getState() {
    return this.state;
  }
});

describe("VisitAgainFeed", () => {
  let BookmarksFeed;
  let instance;
  let reduxState;
  beforeEach(() => {
    BookmarksFeed = require("inject!addon/Feeds/BookmarksFeed")({
      "addon/PlacesProvider": {PlacesProvider},
      "addon/lib/getScreenshot": sinon.spy(() => testScreenshot)
    });
    Object.keys(PlacesProvider.links).forEach(k => PlacesProvider.links[k].reset());
    instance = new BookmarksFeed({getCachedMetadata});
    instance.refresh = sinon.spy();
    reduxState = {Experiments: {values: {}}};
    instance.store = {getState() { return reduxState; }};
    sinon.spy(instance.options, "getCachedMetadata");
  });
  it("should create a BookmarksFeed", () => {
    assert.instanceOf(instance, BookmarksFeed);
  });
  it("should have an UPDATE_TIME of 15 minutes", () => {
    const time = moment.duration(BookmarksFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 15);
  });
  describe("#getData", () => {
    it("should resolve with a BOOKMARKS_RESPONSE action", () =>
      instance.getData()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "BOOKMARKS_RESPONSE");
          assert.lengthOf(action.data, 2);
        })
    );
    it("should call getBookmarks with a limit of BOOKMARKS_LENGTH", () =>
      instance.getData()
        .then(() => {
          assert.calledWithExactly(PlacesProvider.links.getBookmarks, {limit: BOOKMARKS_LENGTH});
        })
    );
    it("should run sites through getCachedMetadata", () =>
      instance.getData()
        .then(action => {
          assert.calledOnce(instance.options.getCachedMetadata);
          assert.deepEqual(action.data, getCachedMetadata(testLinks));
        })
    );
    it("should set missingData to true if a link is missing a required screenshot", () => {
      instance.shouldGetScreenshot = () => true;
      instance.getScreenshot = sinon.spy(site => null);
      return instance.getData().then(() => {
        assert.equal(instance.missingData, true);
      });
    });
    it("should set hasMetadata to false if a link is missing screenshot", () => {
      instance.options.getCachedMetadata = links => links.map(
        link => { link.hasMetadata = false; return link; }
      );
      return instance.getData().then(() => {
        assert.equal(instance.missingData, true);
      });
    });
    describe("test feed correctly filters links", () => {
      let store;
      beforeEach(() => {
        store = createStoreWithState({});
        instance.connectStore(store);
      });
      it("should filter links with hasMetadata set to false", () => {
        instance.options.getCachedMetadata = links => links.map(
          link => { link.hasMetadata = false; return link; }
        );
        return instance.getData().then(result => {
          assert.equal(result.data.length, 0);
        });
      });
      it("should get some links from PlacesProvider", () =>
        PlacesProvider.links.getBookmarks().then(links => assert.notEqual(links, 0))
      );
      it("should allow links with with metadata", () =>
        instance.getData().then(result => assert.equal(result.data.length, testLinks.length))
      );
    });
  });
  describe("#onAction", () => {
    let store;
    beforeEach(() => {
      instance.refresh = sinon.spy();
      store = createStoreWithState({});
      instance.connectStore(store);
    });
    it("should call refresh on APP_INIT", () => {
      instance.onAction(store.getState(), {type: "APP_INIT"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "app was initializing");
    });
    it("should call refresh on RECEIVE_BOOKMARK_ADDED", () => {
      instance.onAction(store.getState(), {type: "RECEIVE_BOOKMARK_ADDED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a bookmark was added");
    });
    it("should call refresh on RECEIVE_BOOKMARK_REMOVED", () => {
      instance.onAction(store.getState(), {type: "RECEIVE_BOOKMARK_REMOVED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a bookmark was removed");
    });
    it("should call refresh on SCREENSHOT_UPDATED if missing data is true", () => {
      instance.missingData = true;
      instance.onAction(store.getState(), {type: "SCREENSHOT_UPDATED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new screenshot is available and we're missing data");
    });
    it("should not call refresh on SCREENSHOT_UPDATED if missing data is false", () => {
      instance.missingData = false;
      instance.onAction(store.getState(), {type: "SCREENSHOT_UPDATED"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on METADATA_UPDATED if missing data is true", () => {
      instance.missingData = true;
      instance.onAction(store.getState(), {type: "METADATA_UPDATED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new metadata is available and we're missing data");
    });
    it("should not call refresh on METADATA_UPDATED if missing data is false", () => {
      instance.missingData = false;
      instance.onAction(store.getState(), {type: "METADATA_UPDATED"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on SYNC_COMPLETE", () => {
      instance.onAction(store.getState(), {type: "SYNC_COMPLETE"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new tabs synced");
    });
    it("should not call refresh on MANY_LINKS_CHANGED", () => {
      instance.onAction(store.getState(), {type: "MANY_LINKS_CHANGED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "frecency of many links changed");
    });
  });
});
