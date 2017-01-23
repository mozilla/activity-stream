const testLinks = ["foo.com", "bar.com"];
const getCachedMetadata = sites => sites.map(site => site.toUpperCase());
const PlacesProvider = {
  links: {
    asyncGetTopNewTabSites: sinon.spy(() => Promise.resolve(testLinks)),
    getTopFrecentSites: sinon.spy(() => Promise.resolve(testLinks))
  }
};
const getScreenshots = sinon.spy(() => Promise.resolve(["foo"]));
const moment = require("moment");
const TopSitesFeed = require("inject!addon/Feeds/TopSitesFeed")({
  "addon/PlacesProvider": {PlacesProvider},
  "addon/lib/getScreenshots": getScreenshots
});

const {TOP_SITES_LENGTH} = require("common/constants");

describe("TopSitesFeed", () => {
  let instance;
  let reduxState;
  beforeEach(() => {
    PlacesProvider.links.getTopFrecentSites.reset();
    PlacesProvider.links.asyncGetTopNewTabSites.reset();
    reduxState = {Experiments: {values: {}}};
    instance = new TopSitesFeed({getCachedMetadata});
    instance.store = {getState() {return reduxState;}};
    sinon.spy(instance.options, "getCachedMetadata");
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
    it("should call getCachedMetadata", () =>
      instance.getData().then(() =>
        assert.calledWith(instance.options.getCachedMetadata, testLinks, "TOP_FRECENT_SITES_RESPONSE")
      )
    );
    it("should resolve with an action", () => instance.getData().then(action => {
      assert.isObject(action);
      assert.equal(action.type, "TOP_FRECENT_SITES_RESPONSE", "type");
      assert.deepEqual(action.data, getCachedMetadata(testLinks));
    }));
    it("should use the original tiles when in the experiment", () => {
      reduxState.Experiments.values.originalNewTabSites = true;
      return instance.getData().then(() => {
        assert.notCalled(PlacesProvider.links.getTopFrecentSites);
        assert.calledOnce(PlacesProvider.links.asyncGetTopNewTabSites);
        assert.calledWith(instance.options.getCachedMetadata, testLinks, "TOP_FRECENT_SITES_RESPONSE");
      });
    });
    it("should add screenshots when in the experiment", () => {
      reduxState.Experiments.values.screenshots = true;
      return instance.getData().then(result => {
        assert.calledOnce(getScreenshots);
        // Note: our fake getScreenshots function resolves with ["foo"]
        assert.deepEqual(result.data, ["foo"]);
      });
    });
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
      instance.state.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "the sites were too old");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is less than update time", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_LENGTH).fill("site")}};
      instance.state.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME - 1);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on MANY_LINKS_CHANGED", () => {
      instance.onAction({}, {type: "MANY_LINKS_CHANGED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "frecency of many links changed");
    });
  });
});
