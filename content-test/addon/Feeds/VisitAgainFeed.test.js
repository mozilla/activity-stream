const {VISITAGAIN_LENGTH} = require("common/constants");
const moment = require("moment");
const testLinks = [{url: "foo.com", hostname: "foo.com"},
                   {url: "bar.com", hostname: "bar.com"}];
const getCachedMetadata = links => links.map(
  link => {
    link.hasMetadata = true;
    link.images = [1, 2, 3];
    return link;
  }
);
const PlacesProvider = {links: {getRecentlyVisited: sinon.spy(() => Promise.resolve(testLinks))}};
const testScreenshot = "screenshot.jpg";

const createStoreWithState = state => ({
  state,
  getState() {
    return this.state;
  }
});

describe("VisitAgainFeed", () => {
  let VisitAgainFeed;
  let instance;
  let reduxState;
  beforeEach(() => {
    VisitAgainFeed = require("inject!addon/Feeds/VisitAgainFeed")({
      "addon/PlacesProvider": {PlacesProvider},
      "addon/lib/getScreenshot": sinon.spy(() => testScreenshot)
    });
    Object.keys(PlacesProvider.links).forEach(k => PlacesProvider.links[k].reset());
    instance = new VisitAgainFeed({getCachedMetadata});
    instance.refresh = sinon.spy();
    reduxState = {Experiments: {values: {}}};
    instance.store = {getState() { return reduxState; }};
    sinon.spy(instance.options, "getCachedMetadata");
  });
  it("should create a VisitAgainFeed", () => {
    assert.instanceOf(instance, VisitAgainFeed);
  });
  it("should have an UPDATE_TIME of 15 minutes", () => {
    const time = moment.duration(VisitAgainFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 15);
  });
  describe("#getData", () => {
    it("should resolve with a VISITAGAIN_RESPONSE action", () =>
      instance.getData()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "VISITAGAIN_RESPONSE");
          assert.lengthOf(action.data, 2);
        })
    );
    it("should call getRecentlyVisited with a limit of VISITAGAIN_LENGTH", () =>
      instance.getData()
        .then(() => {
          assert.calledWithExactly(PlacesProvider.links.getRecentlyVisited, {limit: VISITAGAIN_LENGTH});
        })
    );
    it("should run sites through getCachedMetadata", () =>
      instance.getData()
        .then(action => {
          assert.calledOnce(instance.options.getCachedMetadata);
          assert.deepEqual(action.data, getCachedMetadata(testLinks));
        })
    );
    it("should set missingData to true if a topsite is missing a required screenshot", () => {
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
      it("should filter links with no images", () => {
        instance.options.getCachedMetadata = links => links.map(
          link => {
            link.hasMetadata = true;
            link.images = [];
            return link;
          }
        );
        return instance.getData().then(result => {
          assert.equal(result.data.length, 0);
        });
      });
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
    it("should call refresh on METADATA_UPDATED missingData is true", () => {
      instance.missingData = true;
      instance.onAction(store.getState(), {type: "METADATA_UPDATED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new metadata is available and we're missing data");
    });
    it("should not call refresh on METADATA_UPDATED if missingData is false", () => {
      instance.missingData = false;
      instance.onAction(store.getState(), {type: "METADATA_UPDATED"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on SYNC_COMPLETE", () => {
      instance.onAction({}, {type: "SYNC_COMPLETE"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new tabs synced");
    });
    it("should call refresh on MANY_LINKS_CHANGED", () => {
      instance.onAction({}, {type: "MANY_LINKS_CHANGED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "frecency of many links changed");
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES", () => {
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "always need the newest sites");
    });
  });
});
