const moment = require("moment");

describe("PocketTopicsFeed", () => {
  let PocketTopicsFeed;
  let instance;
  let reduxState;
  beforeEach(() => {
    PocketTopicsFeed = require("inject!addon/Feeds/PocketTopicsFeed")({});
    instance = new PocketTopicsFeed();
    reduxState = {Experiments: {values: {}}};
    instance.refresh = sinon.spy();
    instance.store = {getState() { return reduxState; }};
  });
  it("should create a PocketTopicsFeed", () => {
    assert.instanceOf(instance, PocketTopicsFeed);
  });
  it("should have an UPDATE_TIME of 3 hours", () => {
    const time = moment.duration(PocketTopicsFeed.UPDATE_TIME);
    assert.equal(time.hours(), 3);
  });
  describe("#getData", () => {
    it("should fetch topics and send response event", () => {
      instance._fetchTopics = sinon.mock().returns([{"category": "test"}]);
      return instance.getData()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "POCKET_TOPICS_RESPONSE");
          assert.calledOnce(instance._fetchTopics);
          assert.lengthOf(action.data, 1);
        });
    });
    it("should throw error if API key or endpoint not configured", () => {
      let BrokenPocketTopicFeed = require("inject!addon/Feeds/PocketTopicsFeed")({"../../pocket.json": {"pocket_topic_endpoint": "", "pocket_consumer_key": ""}});
      let brokenInstance = new BrokenPocketTopicFeed();
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
