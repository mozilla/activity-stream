const PlacesProvider = {
  links: {
    getHistorySize: sinon.spy(() => Promise.resolve(42)),
    getBookmarksSize: sinon.spy(() => Promise.resolve(1)),
    getHistorySizeSince: sinon.spy(() => Promise.resolve(0))
  }
};
const {PlacesStatsUpdate} = require("common/action-manager").actions;
const moment = require("moment");
const PlacesStatsFeed = require("inject!addon/Feeds/PlacesStatsFeed")({"addon/PlacesProvider": {PlacesProvider}});

describe("PlacesStatsFeed", () => {
  let instance;
  beforeEach(() => {
    PlacesProvider.links.getHistorySize.reset();
    PlacesProvider.links.getBookmarksSize.reset();
    PlacesProvider.links.getHistorySizeSince.reset();
    const MetadataStore = {
      asyncGetOldestInsert: sinon.spy(() => Promise.resolve(10)),
      asyncCountAllItems: sinon.spy(() => Promise.resolve(0))
    };
    instance = new PlacesStatsFeed({metadataStore: MetadataStore});
  });
  it("should create a PlacesStatsFeed", () => {
    assert.instanceOf(instance, PlacesStatsFeed);
  });
  it("should have an UPDATE_TIME of 24 hours", () => {
    const time = moment.duration(PlacesStatsFeed.UPDATE_TIME);
    assert.equal(time.asHours(), 24);
  });

  describe("#getData", () => {
    it("should return a promise", () => {
      assert.instanceOf(instance.getData(), Promise);
    });
    it("should resolve with a PlacesStatsUpdate action", () => instance.getData().then(action => {
      assert.isObject(action);
      assert.deepEqual(action, PlacesStatsUpdate(42, 1, 0));
    }));
    it("should get the appropriate data from the metadata store", () => instance.getData().then(() => {
      assert.calledOnce(instance.options.metadataStore.asyncGetOldestInsert);
      assert.calledOnce(instance.options.metadataStore.asyncCountAllItems);
    }));
  });

  describe("#onAction", () => {
    let clock;
    beforeEach(() => {
      instance.refresh = sinon.spy();
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });
    it("should call refresh on APP_INIT", () => {
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "app was initializing");
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is too old", () => {
      instance.state.lastUpdated = 0;
      clock.tick(PlacesStatsFeed.UPDATE_TIME);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "queries are older than 24 hours");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is less than update time", () => {
      instance.state.lastUpdated = 0;
      clock.tick(PlacesStatsFeed.UPDATE_TIME - 1);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
  });
});
