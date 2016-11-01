const testLinks = ["foo.com", "bar.com"];
const getMetadata = sites => sites.map(site => site.toUpperCase());
const PlacesProvider = {links: {getTopFrecentSites: sinon.spy(() => Promise.resolve(testLinks))}};
const moment = require("moment");
const TopSitesFeed = require("inject!addon/Feeds/TopSitesFeed")({"addon/PlacesProvider": {PlacesProvider}});

const {TOP_SITES_LENGTH} = require("common/constants");

describe("TopSitesFeed", () => {
  let instance;
  beforeEach(() => {
    PlacesProvider.links.getTopFrecentSites.reset();
    instance = new TopSitesFeed({getMetadata});
    sinon.spy(instance.options, "getMetadata");
  });
  it("should create a TopSitesFeed", () => {
    assert.instanceOf(instance, TopSitesFeed);
  });
  it("should have an UPDATE_TIME of 15 minutes", () => {
    const time = moment.duration(TopSitesFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 15);
  });

  describe("#getData", () => {
    it("should return a promise", () => {
      assert.instanceOf(instance.getData(), Promise);
    });
    it("should call getMetadata", () =>
      instance.getData().then(() =>
        assert.calledWith(instance.options.getMetadata, testLinks, "TOP_FRECENT_SITES_RESPONSE")
      )
    );
    it("should resolve with an action", () => instance.getData().then(action => {
      assert.isObject(action);
      assert.equal(action.type, "TOP_FRECENT_SITES_RESPONSE", "type");
      assert.deepEqual(action.data, getMetadata(testLinks));
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
    it("should call refresh on RECEIVE_PLACES_CHANGES if there are not enough sites", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_LENGTH - 1).fill("site")}};
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "there were not enough sites");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if there are enough sites", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_LENGTH).fill("site")}};
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is too old", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_LENGTH).fill("site")}};
      instance.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "the sites were too old");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is less than update time", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_LENGTH).fill("site")}};
      instance.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME - 1);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
  });
});
