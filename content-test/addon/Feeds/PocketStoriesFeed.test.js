const moment = require("moment");

const PlacesProvider = {links: {blockedURLs: new Set()}};

describe("PocketStoriesFeed", () => {
  let PocketStoriesFeed;
  let instance;
  let reduxState;
  beforeEach(() => {
    PocketStoriesFeed = require("inject!addon/Feeds/PocketStoriesFeed")({"addon/PlacesProvider": {PlacesProvider}});
    instance = new PocketStoriesFeed();
    reduxState = {Experiments: {values: {}}};
    instance.refresh = sinon.spy();
    instance.store = {getState() { return reduxState; }};
  });
  it("should create a PocketStoriesFeed", () => {
    assert.instanceOf(instance, PocketStoriesFeed);
  });
  it("should have an UPDATE_TIME of 30 minutes", () => {
    const time = moment.duration(PocketStoriesFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 30);
  });
  describe("#getData", () => {
    it("should fetch stories and send response event", () => {
      instance._fetchStories = sinon.mock().returns([{"title": "test"}]);
      reduxState = {Experiments: {values: {pocket: true}}};
      return instance.getData()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "POCKET_STORIES_RESPONSE");
          assert.calledOnce(instance._fetchStories);
          assert.lengthOf(action.data, 1);
        });
    });
    it("should exclude blocked (dismissed) URLs", () => {
      instance._fetchStories = sinon.mock().returns([{"dedupe_url": "blocked"}, {"dedupe_url": "not_blocked"}]);
      reduxState = {Experiments: {values: {pocket: true}}};
      PlacesProvider.links.blockedURLs.add("blocked");
      return instance.getData()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "POCKET_STORIES_RESPONSE");
          assert.calledOnce(instance._fetchStories);
          assert.lengthOf(action.data, 1);
          assert.equal(action.data[0].url, "not_blocked");
        });
    });
    it("should throw error if API key or endpoint not configured", () => {
      let BrokenPocketStoriesFeed = require("inject!addon/Feeds/PocketStoriesFeed")({
        "../../pocket.json": {"pocket_story_endpoint": "", "pocket_consumer_key": ""},
        "addon/PlacesProvider": PlacesProvider
      });
      let brokenInstance = new BrokenPocketStoriesFeed();
      brokenInstance.store = {getState() { return reduxState; }};
      reduxState = {Experiments: {values: {pocket: true}}};
      return brokenInstance.getData()
        .then(action => {
          throw new Error("Expected getData to fail with missing configuration");
        }, reason => {
          assert.include(reason.toString(), "pocket.json");
        });
    });
  });
});
