const testLinks = [{url: "http://foo.com/"}, {url: "http://bar.com/"}];
const getCachedMetadata = links => links.map(
  link => {
    link.hasMetadata = true;
    link.hasHighResIcon = true;
    return link;
  }
);
const PlacesProvider = {links: {getTopFrecentSites: sinon.spy(() => Promise.resolve(testLinks))}};
const testScreenshot = "screenshot.jpg";
const moment = require("moment");
const TopSitesFeed = require("inject!addon/Feeds/TopSitesFeed")({"addon/PlacesProvider": {PlacesProvider}});

const {TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");

describe("TopSitesFeed", () => {
  let instance;
  let reduxState;
  beforeEach(() => {
    PlacesProvider.links.getTopFrecentSites.reset();
    reduxState = {Experiments: {values: {}}};
    const pinnedLinks = {
      links: [],
      pin: sinon.spy(),
      unpin: sinon.spy(),
      isPinned: site => false
    };
    instance = new TopSitesFeed({getCachedMetadata, pinnedLinks});
    instance.store = {getState() { return reduxState; }};
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
        hasHighResIcon: true,
        url: "http://www.example.com/"
      };
    });
    it("should not get a screenshot for sites with metadata and large icons", () => {
      assert.equal(false, instance.shouldGetScreenshot(testSite));
    });
    it("should not get a screenshot for sites missing metadata", () => {
      testSite.hasMetadata = false;
      assert.equal(false, instance.shouldGetScreenshot(testSite));
    });
    it("should get a screenshot for sites with metadata and small icons", () => {
      testSite.hasHighResIcon = false;
      assert.equal(true, instance.shouldGetScreenshot(testSite));
    });
    it("should get a screenshot for sites with metadata and large icons that are not root domains", () => {
      testSite.url = "http://www.example.com/non/root/";
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
    it("should not add screenshots to sites that don't qualify for a screenshot", () => {
      instance.shouldGetScreenshot = site => false;
      return instance.getData().then(result => {
        assert.notCalled(instance.getScreenshot);
        for (let link of result.data) {
          assert.equal(link.screenshot, undefined);
        }
      });
    });
    it("should add screenshots to sites that qualify for a screenshot", () => {
      instance.shouldGetScreenshot = site => true;
      return instance.getData().then(result => {
        assert.calledTwice(instance.getScreenshot);
        for (let link of result.data) {
          assert.equal(link.screenshot, testScreenshot);
          assert.notEqual(link.metadata_source.indexOf("+Screenshot"), -1);
        }
      });
    });
    it("should set missingData to true if a topsite is missing a required screenshot", () => {
      instance.shouldGetScreenshot = site => true;
      instance.getScreenshot = sinon.spy(site => null);
      return instance.getData().then(result => {
        assert.equal(instance.missingData, true);
      });
    });
    it("should set missingData to true if and a topsite is missing metadata", () => {
      instance.options.getCachedMetadata = links => links.map(
        link => { link.hasMetadata = false; return link; }
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
      const state = {TopSites: {rows: Array(TOP_SITES_SHOWMORE_LENGTH - 1).fill("site")}};
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "there were not enough sites");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if there are enough sites", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_SHOWMORE_LENGTH).fill("site")}};
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is too old", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_SHOWMORE_LENGTH).fill("site")}};
      instance.state.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "the sites were too old");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is less than update time", () => {
      const state = {TopSites: {rows: Array(TOP_SITES_SHOWMORE_LENGTH).fill("site")}};
      instance.state.lastUpdated = 0;
      clock.tick(TopSitesFeed.UPDATE_TIME - 1);
      instance.onAction(state, {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh and pin on NOTIFY_PIN_TOPSITE", () => {
      instance.onAction({}, {type: "NOTIFY_PIN_TOPSITE", data: {site: {}, index: 1}});
      assert.calledOnce(instance.pinnedLinks.pin);
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a site was pinned");
    });
    it("should call refresh and unpin on NOTIFY_UNPIN_TOPSITE", () => {
      instance.onAction({}, {type: "NOTIFY_UNPIN_TOPSITE", data: {site: {}}});
      assert.calledOnce(instance.pinnedLinks.unpin);
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a site was unpinned");
    });
    it("should call refresh and pin on TOPSITES_ADD_REQUEST", () => {
      const site = {url: "foo.bar", title: "foo"};
      instance.onAction({}, {type: "TOPSITES_ADD_REQUEST", data: site});
      assert.calledOnce(instance.pinnedLinks.pin);
      assert.calledWith(instance.pinnedLinks.pin, site, 0);
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a site was added (pinned)");
    });
  });

  describe("#addTopSite", () => {
    it("should pin site in first slot of empty pinned list", () => {
      const site = {url: "foo.bar", title: "foo"};
      instance.addTopSite({data: site});
      assert.calledOnce(instance.pinnedLinks.pin);
      assert.calledWith(instance.pinnedLinks.pin, site, 0);
    });
    it("should pin site in first slot of pinned list with empty first slot", () => {
      instance.pinnedLinks.links = [null, {url: "example.com"}];
      const site = {url: "foo.bar", title: "foo"};
      instance.addTopSite({data: site});
      assert.calledOnce(instance.pinnedLinks.pin);
      assert.calledWith(instance.pinnedLinks.pin, site, 0);
    });
    it("should move a pinned site in first slot to the next slot", () => {
      const site1 = {url: "example.com"};
      instance.pinnedLinks.links = [site1];
      const site = {url: "foo.bar", title: "foo"};
      instance.addTopSite({data: site});
      assert.calledTwice(instance.pinnedLinks.pin);
      assert.calledWith(instance.pinnedLinks.pin, site, 0);
      assert.calledWith(instance.pinnedLinks.pin, site1, 1);
    });
  });
});
