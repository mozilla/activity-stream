"use strict";
const injector = require("inject!lib/FaviconFeed.jsm");
const {FakePrefs, GlobalOverrider} = require("test/unit/utils");
const {actionTypes: at} = require("common/Actions.jsm");

describe("FaviconFeed", () => {
  let FaviconFeed;
  let feed;
  let globals;
  let sandbox;

  beforeEach(() => {
    FakePrefs.prototype.prefs["tippyTop.service.endpoint"] = "https://foo.com/";
    globals = new GlobalOverrider();
    sandbox = globals.sandbox;
    globals.set("PlacesUtils", {
      favicons: {
        setAndFetchFaviconForPage: sandbox.spy(),
        FAVICON_LOAD_NON_PRIVATE: 1
      }
    });
    let fetchStub = globals.sandbox.stub();
    globals.set("fetch", fetchStub);
    fetchStub.resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{
        "title": "facebook",
        "url": "https://www.facebook.com/",
        "image_url": "https://www.facebook.com/icon.png"
      }, {
        "title": "gmail",
        "urls": ["https://www.gmail.com/", "https://mail.google.com"],
        "image_url": "https://iconserver.com/gmail.png"
      }])
    });

    ({FaviconFeed} = injector({"lib/ActivityStreamPrefs.jsm": {Prefs: FakePrefs}}));
    feed = new FaviconFeed();
    feed.store = {
      dispatch: sinon.spy(),
      getState() { return this.state; },
      state: {
        Prefs: {},
        TippyTop: {initialized: false, sitesByDomain: {}}
      }
    };
  });
  afterEach(() => {
    globals.restore();
  });

  it("should create a TopStoriesFeed", () => {
    assert.instanceOf(feed, FaviconFeed);
  });

  describe("#getSitesByDomain", () => {
    it("should loadCachedData and maybeRefresh if _sitesByDomain isn't set", async () => {
      feed.loadCachedData = sinon.spy(() => ([]));
      feed.maybeRefresh = sinon.spy(() => {
        feed._sitesByDomain = {"mozilla.org": {"url": "https://mozilla.org", "image_url": "https://mozilla.org/icon.png"}};
        return [];
      });
      await feed.getSitesByDomain();
      assert.calledOnce(feed.loadCachedData);
      assert.calledOnce(feed.maybeRefresh);
    });
    it("should NOT loadCachedData and maybeRefresh if _sitesByDomain is already set", async () => {
      feed._sitesByDomain = {"mozilla.org": {"url": "https://mozilla.org", "image_url": "https://mozilla.org/icon.png"}};
      feed.loadCachedData = sinon.spy(() => ([]));
      feed.maybeRefresh = sinon.spy(() => ([]));
      await feed.getSitesByDomain();
      assert.notCalled(feed.loadCachedData);
      assert.notCalled(feed.maybeRefresh);
    });
    it("should resolve to empty object if there is no cache and fetch fails", async () => {
      feed.loadCachedData = sinon.spy(() => ([]));
      feed.maybeRefresh = sinon.spy(() => ([]));
      await feed.getSitesByDomain();
      assert.deepEqual(feed._sitesByDomain, {});
    });
  });

  describe("#loadCachedData", () => {
    it("should set _sitesByDomain if there is cached data", async () => {
      const cachedData = {
        "mozilla.org": {"url": "https://mozilla.org", "image_url": "https://mozilla.org/icon.png"},
        "_timestamp": Date.now(),
        "_etag": "foobaretag1234567890"
      };
      feed.cache.get = () => cachedData;
      await feed.loadCachedData();
      assert.deepEqual(feed._sitesByDomain, cachedData);
      assert.equal(feed.tippyTopLastUpdated, cachedData._timestamp);
      assert.equal(feed._sitesByDomain._etag, cachedData._etag);
    });
    it("should NOT set _sitesByDomain if there is no cached data", async () => {
      feed.cache.get = () => ({});
      await feed.loadCachedData();
      assert.isNull(feed._sitesByDomain);
    });
  });

  describe("#maybeRefresh", () => {
    it("should refresh if last update was over a day back", () => {
      feed.refresh = sinon.spy();
      feed.tippyTopLastUpdated = Date.now() - 25 * 60 * 60 * 1000;
      feed.maybeRefresh();
      assert.calledOnce(feed.refresh);
    });
    it("should NOT refresh if last update was within last day", () => {
      feed.refresh = sinon.spy();
      feed.tippyTopLastUpdated = Date.now() - 23 * 60 * 60 * 1000;
      feed.maybeRefresh();
      assert.notCalled(feed.refresh);
    });
  });

  describe("#refresh", () => {
    it("should loadFromURL with the right URL from prefs", async () => {
      feed.loadFromURL = sinon.spy(() => ({data: []}));
      await feed.refresh();
      assert.calledOnce(feed.loadFromURL);
      assert.calledWith(feed.loadFromURL, FakePrefs.prototype.prefs["tippyTop.service.endpoint"]);
    });
    it("should set _sitesByDomain if new sites are returned from loadFromURL", async () => {
      const data = {
        data: [
          {"url": "https://mozilla.org", "image_url": "https://mozilla.org/icon.png"},
          {"url": "https://facebook.com", "image_url": "https://facebook.com/icon.png"}
        ],
        etag: "etag1234567890",
        status: 200
      };
      feed.loadFromURL = sinon.spy(url => data);
      feed.cache.set = sinon.spy();
      await feed.refresh();
      assert.equal(feed._sitesByDomain._etag, data.etag);
      assert.deepEqual(feed._sitesByDomain["facebook.com"], {
        image_url: "https://facebook.com/icon.png",
        url: "https://facebook.com"
      });
      assert.deepEqual(feed._sitesByDomain["mozilla.org"], {
        image_url: "https://mozilla.org/icon.png",
        url: "https://mozilla.org"
      });
      assert.calledOnce(feed.cache.set);
    });
    it("should pass If-None-Match if we have a last known etag", async () => {
      feed.loadFromURL = sinon.spy(url => ({data: [], status: 304}));
      feed._sitesByDomain = {};
      feed._sitesByDomain._etag = "etag1234567890";
      await feed.refresh();
      const headers = feed.loadFromURL.getCall(0).args[1];
      assert.equal(headers.get("If-None-Match"), feed._sitesByDomain._etag);
    });
    it("should not set _sitesByDomain if the remote manifest is not modified since last fetch", async () => {
      const data = {"mozilla.org": {"url": "https://mozilla.org", "image_url": "https://mozilla.org/icon.png"}};
      feed._sitesByDomain = data;
      feed.loadFromURL = sinon.spy(url => ({data: [], status: 304}));
      feed.cache.set = sinon.spy();
      await feed.refresh();
      assert.deepEqual(feed._sitesByDomain, data);
      assert.notCalled(feed.cache.set);
    });
  });

  describe("#fetchIcon", () => {
    it("should setAndFetchFaviconForPage if the url is in the TippyTop data", async () => {
      let url = "https://mozilla.org";
      feed._sitesByDomain = {"mozilla.org": {url, image_url: `${url}/icon.png`}};
      await feed.fetchIcon(url);
      assert.calledOnce(global.PlacesUtils.favicons.setAndFetchFaviconForPage);
      assert.calledWith(global.PlacesUtils.favicons.setAndFetchFaviconForPage,
        {spec: url},
        {ref: "tippytop", spec: `${url}/icon.png`},
        false,
        global.PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE,
        null,
        undefined);
    });
    it("should NOT setAndFetchFaviconForPage if the url is NOT in the TippyTop data", async () => {
      let url = "https://mozilla.org";
      feed.store.state.TippyTop.sitesByDomain["mozilla.org"] = {url, image_url: `${url}/icon.png`};
      await feed.fetchIcon("https://example.com");
      assert.notCalled(global.PlacesUtils.favicons.setAndFetchFaviconForPage);
    });
  });

  describe("#onAction", () => {
    it("should maybeRefresh on SYSTEM_TICK if initialized", async () => {
      feed._sitesByDomain = {"mozilla.org": {}};
      feed.maybeRefresh = sinon.spy();
      feed.onAction({type: at.SYSTEM_TICK});
      assert.calledOnce(feed.maybeRefresh);
    });
    it("should NOT maybeRefresh on SYSTEM_TICK if NOT initialized", async () => {
      feed._sitesByDomain = null;
      feed.maybeRefresh = sinon.spy();
      feed.onAction({type: at.SYSTEM_TICK});
      assert.notCalled(feed.maybeRefresh);
    });
    it("should fetchIcon on RICH_ICON_MISSING", async () => {
      feed.fetchIcon = sinon.spy();
      const url = "https://mozilla.org";
      feed.onAction({type: at.RICH_ICON_MISSING, data: {url}});
      assert.calledOnce(feed.fetchIcon);
      assert.calledWith(feed.fetchIcon, url);
    });
  });
});
