const testLinks = [{url: "http://foo.com/"}, {url: "http://bar.com/"}];
const getCachedMetadata = links => links.map(
  link => {link.hasMetadata = true; return link;}
);
const PlacesProvider = {links: {getTopFrecentSites: sinon.spy(() => Promise.resolve(testLinks))}};
const testScreenshot = "screenshot.jpg";
const moment = require("moment");
const TopSitesFeed = require("inject!addon/Feeds/TopSitesFeed")({"addon/PlacesProvider": {PlacesProvider}});

const {TOP_SITES_LENGTH} = require("common/constants");

describe("TopSitesFeed", () => {
  let instance;
  let reduxState;
  beforeEach(() => {
    PlacesProvider.links.getTopFrecentSites.reset();
    reduxState = {Experiments: {values: {}}};
    instance = new TopSitesFeed({getCachedMetadata});
    instance.store = {getState() {return reduxState;}};
    instance.getScreenshot = sinon.spy(() => testScreenshot);
    sinon.spy(instance.options, "getCachedMetadata");
  });
  it("should create a TopSitesFeed", () => {
    assert.instanceOf(instance, TopSitesFeed);
  });
  it("should have an UPDATE_TIME of 15 minutes", () => {
    const time = moment.duration(TopSitesFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 15);
  });

  describe("#shouldGetScreenshot", () => {
    let testSite;

    beforeEach(() => {
      testSite = {
        hasMetadata: true,
        url: "http://www.example.com/",
        favicon_width: TopSitesFeed.MIN_ICON_SIZE,
        favicon_height: TopSitesFeed.MIN_ICON_SIZE
      };
    });
    it("should not get a screenshot for sites missing metadata", () => {
      testSite.favicon_width = null;
      testSite.favicon_height = null;
      testSite.hasMetadata = false;
      assert.equal(false, instance.shouldGetScreenshot(testSite));
    });
    it("should not get a screenshot for sites with metadata and large icons", () => {
      assert.equal(false, instance.shouldGetScreenshot(testSite));
    });
    it("should get a screenshot for sites with metadata and small icons", () => {
      testSite.favicon_width = TopSitesFeed.MIN_ICON_SIZE - 1;
      testSite.favicon_height = TopSitesFeed.MIN_ICON_SIZE - 1;
      assert.equal(true, instance.shouldGetScreenshot(testSite));
    });
    it("should get a screenshot for sites with metadata and large icons that are not root domains", () => {
      testSite.url = "http://www.example.com/non/root/";
      assert.equal(true, instance.shouldGetScreenshot(testSite));
    });
    it("should get a screenshot for sites with metadata and missing icon size", () => {
      testSite.favicon_width = null;
      testSite.favicon_height = null;
      assert.equal(true, instance.shouldGetScreenshot(testSite));
    });
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
    it("should not add screenshots to sites that qualify for a screenshot if the experiment is disabled", () => {
      reduxState.Experiments.values.screenshots = false;
      instance.shouldGetScreenshot = site => true;
      return instance.getData().then(result => {
        assert.notCalled(instance.getScreenshot);
        for (let link of result.data) {
          assert.equal(link.screenshot, undefined);
        }
      });
    });
    it("should not add screenshots to sites that don't qualify for a screenshot if the experiment is enabled", () => {
      reduxState.Experiments.values.screenshots = true;
      instance.shouldGetScreenshot = site => false;
      return instance.getData().then(result => {
        assert.notCalled(instance.getScreenshot);
        for (let link of result.data) {
          assert.equal(link.screenshot, undefined);
        }
      });
    });
    it("should add screenshots to sites that qualify for a screenshot if the experiment is enabled", () => {
      reduxState.Experiments.values.screenshots = true;
      instance.shouldGetScreenshot = site => true;
      return instance.getData().then(result => {
        assert.calledTwice(instance.getScreenshot);
        for (let link of result.data) {
          assert.equal(link.screenshot, testScreenshot);
          assert.notEqual(link.metadata_source.indexOf("+Screenshot"), -1);
        }
      });
    });
    it("should set missingData to false if screenshot experiment is disabled", () =>
      instance.getData().then(result => assert.equal(instance.missingData, false))
    );
    it("should set missingData to true if screenshot experiment is enabled and a topsite is missing a required screenshot", () => {
      reduxState.Experiments.values.screenshots = true;
      instance.shouldGetScreenshot = site => true;
      instance.getScreenshot = sinon.spy(site => null);
      return instance.getData().then(result => {
        assert.equal(instance.missingData, true);
      });
    });
    it("should set missingData to true if screenshot experiment is enabled and a topsite is missing metadata", () => {
      reduxState.Experiments.values.screenshots = true;
      instance.options.getCachedMetadata = links => links.map(
        link => {link.hasMetadata = false; return link;}
      );
      return instance.getData().then(result => {
        assert.equal(instance.missingData, true);
      });
    });
  });

  describe("#onAction", () => {
    let clock;
    beforeEach(() => {
      instance.refresh = sinon.spy();
      instance.missingData = false;
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
    it("should call refresh on METADATA_UPDATED if it's missing data", () => {
      instance.missingData = true;
      instance.onAction({}, {type: "METADATA_UPDATED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "new metadata is available and we're missing data");
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
