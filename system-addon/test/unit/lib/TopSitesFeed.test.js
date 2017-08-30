"use strict";
const injector = require("inject!lib/TopSitesFeed.jsm");
const {UPDATE_TIME} = require("lib/TopSitesFeed.jsm");
const {FakePrefs, GlobalOverrider} = require("test/unit/utils");
const action = {meta: {fromTarget: {}}};
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {insertPinned, TOP_SITES_SHOWMORE_LENGTH} = require("common/Reducers.jsm");

const FAKE_FRECENCY = 200;
const FAKE_LINKS = new Array(TOP_SITES_SHOWMORE_LENGTH).fill(null).map((v, i) => ({
  frecency: FAKE_FRECENCY,
  url: `http://www.site${i}.com`
}));
const FAKE_SCREENSHOT = "data123";

function FakeTippyTopProvider() {}
FakeTippyTopProvider.prototype = {
  async init() {},
  processSite(site) { return site; }
};

describe("Top Sites Feed", () => {
  let TopSitesFeed;
  let DEFAULT_TOP_SITES;
  let feed;
  let globals;
  let sandbox;
  let links;
  let clock;
  let fakeNewTabUtils;
  let fakeScreenshot;
  let shortURLStub;

  beforeEach(() => {
    globals = new GlobalOverrider();
    sandbox = globals.sandbox;
    fakeNewTabUtils = {
      blockedLinks: {
        links: [],
        isBlocked: () => false
      },
      activityStreamLinks: {getTopSites: sandbox.spy(() => Promise.resolve(links))},
      pinnedLinks: {
        links: [],
        isPinned: () => false,
        pin: sandbox.spy(),
        unpin: sandbox.spy()
      }
    };
    fakeScreenshot = {getScreenshotForURL: sandbox.spy(() => Promise.resolve(FAKE_SCREENSHOT))};
    shortURLStub = sinon.stub().callsFake(site => site.url);
    const fakeDedupe = function() {};
    globals.set("NewTabUtils", fakeNewTabUtils);
    FakePrefs.prototype.prefs["default.sites"] = "https://foo.com/";
    ({TopSitesFeed, DEFAULT_TOP_SITES} = injector({
      "lib/ActivityStreamPrefs.jsm": {Prefs: FakePrefs},
      "common/Dedupe.jsm": {Dedupe: fakeDedupe},
      "common/Reducers.jsm": {insertPinned, TOP_SITES_SHOWMORE_LENGTH},
      "lib/Screenshots.jsm": {Screenshots: fakeScreenshot},
      "lib/TippyTopProvider.jsm": {TippyTopProvider: FakeTippyTopProvider},
      "lib/ShortURL.jsm": {shortURL: shortURLStub}
    }));
    feed = new TopSitesFeed();
    feed.store = {dispatch: sinon.spy(), getState() { return {TopSites: {rows: Array(12).fill("site")}}; }};
    feed.dedupe.group = sites => sites;
    links = FAKE_LINKS;
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    globals.restore();
    clock.restore();
  });

  describe("#refreshDefaults", () => {
    it("should add defaults on PREFS_INITIAL_VALUES", () => {
      feed.onAction({type: at.PREFS_INITIAL_VALUES, data: {"default.sites": "https://foo.com"}});

      assert.isAbove(DEFAULT_TOP_SITES.length, 0);
    });
    it("should add defaults on PREF_CHANGED", () => {
      feed.onAction({type: at.PREF_CHANGED, data: {name: "default.sites", value: "https://foo.com"}});

      assert.isAbove(DEFAULT_TOP_SITES.length, 0);
    });
    it("should have default sites with .isDefault = true", () => {
      feed.refreshDefaults("https://foo.com");

      DEFAULT_TOP_SITES.forEach(link => assert.propertyVal(link, "isDefault", true));
    });
    it("should add no defaults on empty pref", () => {
      feed.refreshDefaults("");

      assert.equal(DEFAULT_TOP_SITES.length, 0);
    });
    it("should clear defaults", () => {
      feed.refreshDefaults("https://foo.com");
      feed.refreshDefaults("");

      assert.equal(DEFAULT_TOP_SITES.length, 0);
    });
  });
  describe("#getLinksWithDefaults", () => {
    beforeEach(() => {
      feed.refreshDefaults("https://foo.com");
    });

    it("should get the links from NewTabUtils", async () => {
      const result = await feed.getLinksWithDefaults();
      const reference = links.map(site => Object.assign({}, site, {hostname: shortURLStub(site)}));

      assert.deepEqual(result, reference);
      assert.calledOnce(global.NewTabUtils.activityStreamLinks.getTopSites);
    });
    it("should filter out low frecency links", async () => {
      links = [
        {frecency: FAKE_FRECENCY, url: "https://enough/visited"},
        {frecency: 100, url: "https://visited/once"},
        {frecency: 0, url: "https://unvisited/page"}
      ];

      const result = await feed.getLinksWithDefaults();

      assert.equal(result[0].url, links[0].url);
      assert.notEqual(result[1].url, links[1].url);
      assert.notEqual(result[1].url, links[2].url);
    });
    it("should filter out the defaults that have been blocked", async () => {
      // make sure we only have one top site, and we block the only default site we have to show
      const url = "www.myonlytopsite.com";
      const topsite = {
        frecency: FAKE_FRECENCY,
        hostname: shortURLStub({url}),
        url
      };
      const blockedDefaultSite = {url: "https://foo.com"};
      fakeNewTabUtils.activityStreamLinks.getTopSites = () => [topsite];
      fakeNewTabUtils.blockedLinks.isBlocked = site => (site.url === blockedDefaultSite.url);
      const result = await feed.getLinksWithDefaults();

      // what we should be left with is just the top site we added, and not the default site we blocked
      assert.lengthOf(result, 1);
      assert.deepEqual(result[0], topsite);
      assert.notInclude(result, blockedDefaultSite);
    });
    it("should call dedupe on the links", async () => {
      const stub = sinon.stub(feed.dedupe, "group").callsFake(id => id);

      await feed.getLinksWithDefaults();

      assert.calledOnce(stub);
    });
    it("should dedupe the links by hostname", async () => {
      const site = {url: "foo", hostname: "bar"};
      const result = feed._dedupeKey(site);

      assert.equal(result, site.hostname);
    });
    it("should add defaults if there are are not enough links", async () => {
      links = [{frecency: FAKE_FRECENCY, url: "foo.com"}];

      const result = await feed.getLinksWithDefaults();
      const reference = [...links, ...DEFAULT_TOP_SITES].map(s => Object.assign({}, s, {hostname: shortURLStub(s)}));

      assert.deepEqual(result, reference);
    });
    it("should only add defaults up to TOP_SITES_SHOWMORE_LENGTH", async () => {
      links = [];
      for (let i = 0; i < TOP_SITES_SHOWMORE_LENGTH - 1; i++) {
        links.push({frecency: FAKE_FRECENCY, url: `foo${i}.com`});
      }
      const result = await feed.getLinksWithDefaults();
      const reference = [...links, DEFAULT_TOP_SITES[0]].map(s => Object.assign({}, s, {hostname: shortURLStub(s)}));

      assert.lengthOf(result, TOP_SITES_SHOWMORE_LENGTH);
      assert.deepEqual(result, reference);
    });
    it("should not throw if NewTabUtils returns null", () => {
      links = null;
      assert.doesNotThrow(() => {
        feed.getLinksWithDefaults(action);
      });
    });
    describe("deduping", () => {
      beforeEach(() => {
        ({TopSitesFeed, DEFAULT_TOP_SITES} = injector({
          "lib/ActivityStreamPrefs.jsm": {Prefs: FakePrefs},
          "common/Reducers.jsm": {insertPinned, TOP_SITES_SHOWMORE_LENGTH},
          "lib/Screenshots.jsm": {Screenshots: fakeScreenshot}
        }));
        feed = new TopSitesFeed();
      });
      it("should not dedupe pinned sites", async () => {
        fakeNewTabUtils.pinnedLinks.links = [
          {url: "https://developer.mozilla.org/en-US/docs/Web"},
          {url: "https://developer.mozilla.org/en-US/docs/Learn"}
        ];

        const sites = await feed.getLinksWithDefaults();

        assert.lengthOf(sites, TOP_SITES_SHOWMORE_LENGTH);
        assert.equal(sites[0].url, fakeNewTabUtils.pinnedLinks.links[0].url);
        assert.equal(sites[1].url, fakeNewTabUtils.pinnedLinks.links[1].url);
        assert.equal(sites[0].hostname, sites[1].hostname);
      });
      it("should not dedupe pinned sites", async () => {
        fakeNewTabUtils.pinnedLinks.links = [
          {url: "https://developer.mozilla.org/en-US/docs/Web"},
          {url: "https://developer.mozilla.org/en-US/docs/Learn"}
        ];
        // These will be the frecent results.
        links = [
          {url: "https://developer.mozilla.org/en-US/docs/Web"},
          {url: "https://developer.mozilla.org/en-US/docs/Learn"}
        ];

        const sites = await feed.getLinksWithDefaults();

        // Frecent results are removed and only pinned are kept.
        assert.lengthOf(sites, 2);
      });
      it("should return sites that have a title", async () => {
        // Simulate a pinned link with no title.
        fakeNewTabUtils.pinnedLinks.links = [{url: "https://github.com/mozilla/activity-stream"}];

        const sites = await feed.getLinksWithDefaults();

        for (const site of sites) {
          assert.isDefined(site.hostname);
        }
      });
      it("should check against null entries", async () => {
        fakeNewTabUtils.pinnedLinks.links = [null];

        await feed.getLinksWithDefaults();
      });
    });
  });
  describe("#refresh", () => {
    it("should dispatch an action with the links returned", async () => {
      sandbox.stub(feed, "getScreenshot");
      await feed.refresh(action);
      const reference = links.map(site => Object.assign({}, site, {hostname: shortURLStub(site)}));

      assert.calledOnce(feed.store.dispatch);
      assert.propertyVal(feed.store.dispatch.firstCall.args[0], "type", at.TOP_SITES_UPDATED);
      assert.deepEqual(feed.store.dispatch.firstCall.args[0].data, reference);
    });
    it("should reuse screenshots for existing links, and call feed.getScreenshot for others", async () => {
      sandbox.stub(feed, "getScreenshot");
      const rows = [{url: FAKE_LINKS[0].url, screenshot: "foo.jpg"}];
      feed.store.getState = () => ({TopSites: {rows}});
      await feed.refresh(action);

      const results = feed.store.dispatch.firstCall.args[0].data;

      results.forEach(link => {
        if (link.url === FAKE_LINKS[0].url) {
          assert.equal(link.screenshot, "foo.jpg");
        } else {
          assert.calledWith(feed.getScreenshot, link.url);
        }
      });
    });
    it("should handle empty slots in the resulting top sites array", async () => {
      links = [FAKE_LINKS[0]];
      fakeNewTabUtils.pinnedLinks.links = [null, null, FAKE_LINKS[1], null, null, null, null, null, FAKE_LINKS[2]];
      sandbox.stub(feed, "getScreenshot");
      await feed.refresh(action);
      assert.calledOnce(feed.store.dispatch);
    });
    it("should skip getting screenshot if there is a tippy top icon", async () => {
      sandbox.stub(feed, "getScreenshot");
      feed._tippyTopProvider.processSite = site => {
        site.tippyTopIcon = "icon.png";
        site.backgroundColor = "#fff";
        return site;
      };
      await feed.refresh(action);
      assert.calledOnce(feed.store.dispatch);
      assert.notCalled(feed.getScreenshot);
    });
  });
  describe("getScreenshot", () => {
    it("should call Screenshots.getScreenshotForURL with the right url", async () => {
      const url = "foo.com";
      await feed.getScreenshot(url);
      assert.calledWith(fakeScreenshot.getScreenshotForURL, url);
    });
  });
  describe("#onAction", () => {
    const newTabAction = {type: at.NEW_TAB_LOAD, meta: {fromTarget: "target"}};
    it("should not call refresh if there are enough sites on NEW_TAB_LOAD", () => {
      feed.lastUpdated = Date.now();
      sinon.stub(feed, "refresh");
      feed.onAction(newTabAction);
      assert.notCalled(feed.refresh);
    });
    it("should call refresh if .lastUpdated is too old on NEW_TAB_LOAD", () => {
      feed.lastUpdated = 0;
      clock.tick(UPDATE_TIME);
      sinon.stub(feed, "refresh");
      feed.onAction(newTabAction);
      assert.calledWith(feed.refresh, newTabAction.meta.fromTarget);
    });
    it("should not call refresh if .lastUpdated is less than update time on NEW_TAB_LOAD", () => {
      feed.lastUpdated = 0;
      clock.tick(UPDATE_TIME - 1);
      sinon.stub(feed, "refresh");
      feed.onAction(newTabAction);
      assert.notCalled(feed.refresh);
    });
    it("should call with correct parameters on TOP_SITES_PIN", () => {
      const pinAction = {
        type: at.TOP_SITES_PIN,
        data: {site: {url: "foo.com"}, index: 7}
      };
      feed.onAction(pinAction);
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, pinAction.data.site, pinAction.data.index);
    });
    it("should get correct isDefault and index property", () => {
      // When calling _getPinnedWithData the state in `pinnedLinks` and in the store should merge.
      const site = {url: "foo.com"};
      const siteWithIndex = {url: "foo.com", isDefault: true, index: 7};
      fakeNewTabUtils.pinnedLinks.links = [siteWithIndex];
      feed.store = {dispatch: sinon.spy(), getState() { return {TopSites: {rows: [site]}}; }};
      const pinAction = {
        type: at.TOP_SITES_PIN,
        data: {}
      };
      feed.onAction(pinAction);
      assert.calledOnce(feed.store.dispatch);
      assert.calledWith(feed.store.dispatch, ac.BroadcastToContent({
        type: at.PINNED_SITES_UPDATED,
        data: [siteWithIndex]
      }));
    });
    it("should get correct pinned links and data", () => {
      // When calling _getPinnedWithData the state in `pinnedLinks` and in the store should merge.
      // In this case `site1` is a pinned site and should be returned.
      const site1 = {url: "foo.com", isDefault: true};
      const site2 = {url: "bar.com", isDefault: false};
      fakeNewTabUtils.pinnedLinks.links = [site1];
      feed.store = {dispatch: sinon.spy(), getState() { return {TopSites: {rows: [site2]}}; }};
      const pinAction = {
        type: at.TOP_SITES_PIN,
        data: {}
      };
      feed.onAction(pinAction);
      assert.calledOnce(feed.store.dispatch);
      assert.calledWith(feed.store.dispatch, ac.BroadcastToContent({
        type: at.PINNED_SITES_UPDATED,
        data: [Object.assign({}, site1, {hostname: "foo.com"})]
      }));
    });
    it("should call unpin with correct parameters on TOP_SITES_UNPIN", () => {
      fakeNewTabUtils.pinnedLinks.links = [null, null, {url: "foo.com"}, null, null, null, null, null, FAKE_LINKS[0]];
      const unpinAction = {
        type: at.TOP_SITES_UNPIN,
        data: {site: {url: "foo.com"}}
      };
      feed.onAction(unpinAction);
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.unpin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.unpin, unpinAction.data.site);
    });
    it("should call refresh without a target if we clear history with PLACES_HISTORY_CLEARED", () => {
      sandbox.stub(feed, "refresh");
      feed.onAction({type: at.PLACES_HISTORY_CLEARED});
      assert.calledOnce(feed.refresh);
      assert.equal(feed.refresh.firstCall.args[0], null);
    });
    it("should still dispatch an action even if there's no target provided", async () => {
      sandbox.stub(feed, "getScreenshot");
      await feed.refresh();
      assert.calledOnce(feed.store.dispatch);
      assert.propertyVal(feed.store.dispatch.firstCall.args[0], "type", at.TOP_SITES_UPDATED);
    });
    it("should call refresh on INIT action", async () => {
      sinon.stub(feed, "refresh");
      await feed.onAction({type: at.INIT});
      assert.calledOnce(feed.refresh);
    });
    it("should call refresh without a target on PLACES_LINK_BLOCKED action", async () => {
      sinon.stub(feed, "refresh");
      await feed.onAction({type: at.PLACES_LINK_BLOCKED});
      assert.calledOnce(feed.refresh);
      assert.equal(feed.refresh.firstCall.args[0], null);
    });
    it("should call refresh without a target on PLACES_LINK_DELETED action", async () => {
      sinon.stub(feed, "refresh");
      await feed.onAction({type: at.PLACES_LINK_DELETED});
      assert.calledOnce(feed.refresh);
      assert.equal(feed.refresh.firstCall.args[0], null);
    });
    it("should call pin with correct args on TOP_SITES_ADD", () => {
      const addAction = {
        type: at.TOP_SITES_ADD,
        data: {site: {url: "foo.bar", label: "foo"}}
      };
      feed.onAction(addAction);
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, addAction.data.site, 0);
    });
  });
  describe("#add", () => {
    it("should pin site in first slot of empty pinned list", () => {
      const site = {url: "foo.bar", label: "foo"};
      feed.add({data: {site}});
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 0);
    });
    it("should pin site in first slot of pinned list with empty first slot", () => {
      fakeNewTabUtils.pinnedLinks.links = [null, {url: "example.com"}];
      const site = {url: "foo.bar", label: "foo"};
      feed.add({data: {site}});
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 0);
    });
    it("should move a pinned site in first slot to the next slot: part 1", () => {
      const site1 = {url: "example.com"};
      fakeNewTabUtils.pinnedLinks.links = [site1];
      const site = {url: "foo.bar", label: "foo"};
      feed.add({data: {site}});
      assert.calledTwice(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 0);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site1, 1);
    });
    it("should move a pinned site in first slot to the next slot: part 2", () => {
      const site1 = {url: "example.com"};
      const site2 = {url: "example.org"};
      fakeNewTabUtils.pinnedLinks.links = [site1, null, site2];
      const site = {url: "foo.bar", label: "foo"};
      feed.add({data: {site}});
      assert.calledTwice(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 0);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site1, 1);
    });
  });
  describe("#pin", () => {
    it("should pin site in specified slot empty pinned list", () => {
      const site = {url: "foo.bar", label: "foo"};
      feed.pin({data: {index: 2, site}});
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 2);
    });
    it("should pin site in specified slot of pinned list that is free", () => {
      fakeNewTabUtils.pinnedLinks.links = [null, {url: "example.com"}];
      const site = {url: "foo.bar", label: "foo"};
      feed.pin({data: {index: 2, site}});
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 2);
    });
    it("should NOT move a pinned site in specified slot to the next slot", () => {
      fakeNewTabUtils.pinnedLinks.links = [null, null, {url: "example.com"}];
      const site = {url: "foo.bar", label: "foo"};
      feed.pin({data: {index: 2, site}});
      assert.calledOnce(fakeNewTabUtils.pinnedLinks.pin);
      assert.calledWith(fakeNewTabUtils.pinnedLinks.pin, site, 2);
    });
  });
});
