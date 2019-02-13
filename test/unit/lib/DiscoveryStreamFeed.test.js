import {actionCreators as ac, actionTypes as at, actionUtils as au} from "common/Actions.jsm";
import {combineReducers, createStore} from "redux";
import {DiscoveryStreamFeed} from "lib/DiscoveryStreamFeed.jsm";
import {reducers} from "common/Reducers.jsm";

const CONFIG_PREF_NAME = "discoverystream.config";
const SPOC_IMPRESSION_TRACKING_PREF = "discoverystream.spoc.impressions";
const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 week

describe("DiscoveryStreamFeed", () => {
  let feed;
  let sandbox;
  let fetchStub;
  let clock;
  const setPref = (name, value) => {
    const action = {
      type: at.PREF_CHANGED,
      data: {
        name,
        value: typeof value === "object" ? JSON.stringify(value) : value,
      },
    };
    feed.store.dispatch(action);
    feed.onAction(action);
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Fetch
    fetchStub = sandbox.stub(global, "fetch");

    // Time
    clock = sinon.useFakeTimers();

    // Feed
    feed = new DiscoveryStreamFeed();
    feed.store = createStore(combineReducers(reducers), {
      Prefs: {
        values: {
          [CONFIG_PREF_NAME]: JSON.stringify({enabled: false, show_spocs: false, layout_endpoint: "foo"}),
        },
      },
    });

    sandbox.stub(feed, "_maybeUpdateCachedData").resolves();
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  describe("#loadLayout", () => {
    it("should fetch data and populate the cache if it is empty", async () => {
      const resp = {layout: ["foo", "bar"]};
      const fakeCache = {};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      fetchStub.resolves({ok: true, json: () => Promise.resolve(resp)});

      await feed.loadLayout(feed.store.dispatch);

      assert.calledOnce(fetchStub);
      assert.equal(feed.cache.set.firstCall.args[0], "layout");
      assert.deepEqual(feed.cache.set.firstCall.args[1].layout, resp.layout);
    });
    it("should fetch data and populate the cache if the cached data is older than 30 mins", async () => {
      const resp = {layout: ["foo", "bar"]};
      const fakeCache = {layout: {layout: ["hello"], lastUpdated: Date.now()}};

      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      fetchStub.resolves({ok: true, json: () => Promise.resolve(resp)});

      clock.tick(THIRTY_MINUTES + 1);
      await feed.loadLayout(feed.store.dispatch);

      assert.calledOnce(fetchStub);
      assert.equal(feed.cache.set.firstCall.args[0], "layout");
      assert.deepEqual(feed.cache.set.firstCall.args[1].layout, resp.layout);
    });
    it("should use the cached data and not fetch if the cached data is less than 30 mins old", async () => {
      const fakeCache = {layout: {layout: ["hello"], lastUpdated: Date.now()}};

      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      clock.tick(THIRTY_MINUTES - 1);
      await feed.loadLayout(feed.store.dispatch);

      assert.notCalled(fetchStub);
      assert.notCalled(feed.cache.set);
    });
    it("should set spocs_endpoint from layout", async () => {
      const resp = {layout: ["foo", "bar"], spocs: {url: "foo.com"}};
      const fakeCache = {};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      fetchStub.resolves({ok: true, json: () => Promise.resolve(resp)});

      await feed.loadLayout(feed.store.dispatch);

      assert.equal(feed.store.getState().DiscoveryStream.spocs.spocs_endpoint, "foo.com");
    });
  });

  describe("#loadComponentFeeds", () => {
    let fakeCache;
    let fakeDiscoveryStream;
    beforeEach(() => {
      fakeDiscoveryStream = {
        DiscoveryStream: {
          layout: [
            {components: [{feed: {url: "foo.com"}}]},
            {components: [{}]},
            {},
          ],
        },
      };
      fakeCache = {};
      sandbox.stub(feed.store, "getState").returns(fakeDiscoveryStream);
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should not dispatch updates when layout is not defined", async () => {
      fakeDiscoveryStream = {
        DiscoveryStream: {},
      };
      feed.store.getState.returns(fakeDiscoveryStream);
      sandbox.spy(feed.store, "dispatch");

      await feed.loadComponentFeeds(feed.store.dispatch);

      assert.notCalled(feed.store.dispatch);
    });

    it("should populate feeds cache", async () => {
      fakeCache = {feeds: {"foo.com": {"lastUpdated": Date.now(), "data": "data"}}};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));

      await feed.loadComponentFeeds(feed.store.dispatch);

      assert.calledWith(feed.cache.set, "feeds", {"foo.com": {"data": "data", "lastUpdated": 0}});
    });

    it("should send at.DISCOVERY_STREAM_FEEDS_UPDATE with new feed data",
      async () => {
        sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
        sandbox.spy(feed.store, "dispatch");

        await feed.loadComponentFeeds(feed.store.dispatch);

        assert.calledWith(feed.store.dispatch, {
          type: at.DISCOVERY_STREAM_FEEDS_UPDATE,
          data: {"foo.com": null},
        });
      });

    it("should return number of promises equal to unique urls",
      async () => {
        sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
        sandbox.stub(global.Promise, "all").resolves();
        fakeDiscoveryStream = {
          DiscoveryStream: {
            layout: [
              {components: [{feed: {url: "foo.com"}}, {feed: {url: "bar.com"}}]},
              {components: [{feed: {url: "foo.com"}}]},
              {},
              {components: [{feed: {url: "baz.com"}}]},
            ],
          },
        };
        feed.store.getState.returns(fakeDiscoveryStream);

        await feed.loadComponentFeeds(feed.store.dispatch);

        assert.calledOnce(global.Promise.all);
        const {args} = global.Promise.all.firstCall;
        assert.equal(args[0].length, 3);
      }
    );

    it("should not record the request time if no fetch request was issued", async () => {
      const fakeComponents = {components: []};
      const fakeLayout = [fakeComponents, {components: [{}]}, {}];
      fakeDiscoveryStream = {DiscoveryStream: {layout: fakeLayout}};
      fakeCache = {feeds: {"foo.com": {"lastUpdated": Date.now(), "data": "data"}}};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      feed.componentFeedRequestTime = undefined;

      await feed.loadComponentFeeds(feed.store.dispatch);

      assert.isUndefined(feed.componentFeedRequestTime);
    });
  });

  describe("#getComponentFeed", () => {
    it("should fetch fresh data if cache is empty", async () => {
      const fakeCache = {};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed, "fetchFromEndpoint").resolves("data");

      const feedResp = await feed.getComponentFeed("foo.com");

      assert.equal(feedResp.data, "data");
    });
    it("should fetch fresh data if cache is old", async () => {
      const fakeCache = {feeds: {"foo.com": {lastUpdated: Date.now()}}};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(fakeCache));
      sandbox.stub(feed, "fetchFromEndpoint").resolves("data");
      clock.tick(THIRTY_MINUTES + 1);

      const feedResp = await feed.getComponentFeed("foo.com");

      assert.equal(feedResp.data, "data");
    });
    it("should return data from cache if it is fresh", async () => {
      const fakeCache = {feeds: {"foo.com": {lastUpdated: Date.now(), data: "data"}}};
      sandbox.stub(feed.cache, "get").resolves(fakeCache);
      sandbox.stub(feed, "fetchFromEndpoint").resolves("old data");
      clock.tick(THIRTY_MINUTES - 1);

      const feedResp = await feed.getComponentFeed("foo.com");

      assert.equal(feedResp.data, "data");
    });
    it("should return null if no response was received", async () => {
      sandbox.stub(feed, "fetchFromEndpoint").resolves(null);

      const feedResp = await feed.getComponentFeed("foo.com");

      assert.isNull(feedResp);
    });
  });

  describe("#loadSpocs", () => {
    beforeEach(() => {
      Object.defineProperty(feed, "showSpocs", {get: () => true});
    });
    it("should not fetch or update cache if no spocs endpoint is defined", async () => {
      feed.store.dispatch(ac.BroadcastToContent({
        type: at.DISCOVERY_STREAM_SPOCS_ENDPOINT,
        data: "",
      }));

      sandbox.spy(feed.cache, "set");

      await feed.loadSpocs(feed.store.dispatch);

      assert.notCalled(global.fetch);
      assert.notCalled(feed.cache.set);
    });
    it("should fetch fresh data if cache is empty", async () => {
      sandbox.stub(feed.cache, "get").returns(Promise.resolve());
      sandbox.stub(feed, "fetchFromEndpoint").resolves("data");
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      await feed.loadSpocs(feed.store.dispatch);

      assert.calledWith(feed.cache.set, "spocs", {"data": "data", "lastUpdated": 0});
      assert.equal(feed.store.getState().DiscoveryStream.spocs.data, "data");
    });
    it("should fetch fresh data if cache is old", async () => {
      const cachedSpoc = {"data": "old", "lastUpdated": Date.now()};
      const cachedData = {"spocs": cachedSpoc};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(cachedData));
      sandbox.stub(feed, "fetchFromEndpoint").resolves("new");
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      clock.tick(THIRTY_MINUTES + 1);

      await feed.loadSpocs(feed.store.dispatch);

      assert.equal(feed.store.getState().DiscoveryStream.spocs.data, "new");
    });
    it("should return data from cache if it is fresh", async () => {
      const cachedSpoc = {"data": "old", "lastUpdated": Date.now()};
      const cachedData = {"spocs": cachedSpoc};
      sandbox.stub(feed.cache, "get").returns(Promise.resolve(cachedData));
      sandbox.stub(feed, "fetchFromEndpoint").resolves("new");
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      clock.tick(THIRTY_MINUTES - 1);

      await feed.loadSpocs(feed.store.dispatch);

      assert.equal(feed.store.getState().DiscoveryStream.spocs.data, "old");
    });
  });

  describe("#showSpocs", () => {
    it("should return false from showSpocs if user pref showSponsored is false", async () => {
      feed.store.getState = () => ({
        Prefs: {values: {showSponsored: false}},
      });
      Object.defineProperty(feed, "config", {get: () => ({show_spocs: true})});

      assert.isFalse(feed.showSpocs);
    });
    it("should return false from showSpocs if DiscoveryStream pref show_spocs is false", async () => {
      feed.store.getState = () => ({
        Prefs: {values: {showSponsored: true}},
      });
      Object.defineProperty(feed, "config", {get: () => ({show_spocs: false})});

      assert.isFalse(feed.showSpocs);
    });
    it("should return true from showSpocs if both prefs are true", async () => {
      feed.store.getState = () => ({
        Prefs: {values: {showSponsored: true}},
      });
      Object.defineProperty(feed, "config", {get: () => ({show_spocs: true})});

      assert.isTrue(feed.showSpocs);
    });
  });

  describe("#clearCache", () => {
    it("should set .layout, .feeds and .spocs to {}", async () => {
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());

      await feed.clearCache();

      assert.calledThrice(feed.cache.set);
      const {firstCall} = feed.cache.set;
      const {secondCall} = feed.cache.set;
      const {thirdCall} = feed.cache.set;
      assert.deepEqual(firstCall.args, ["layout", {}]);
      assert.deepEqual(secondCall.args, ["feeds", {}]);
      assert.deepEqual(thirdCall.args, ["spocs", {}]);
    });
  });

  describe("#filterSpocs", () => {
    it("should return filtered out spocs based on frequency caps", () => {
      const fakeSpocs = {
        spocs: [
          {
            campaign_id: "seen",
            caps: {
              lifetime: 3,
              campaign: {
                count: 1,
                period: 1,
              },
            },
          },
          {
            campaign_id: "not-seen",
            caps: {
              lifetime: 3,
              campaign: {
                count: 1,
                period: 1,
              },
            },
          },
        ],
      };
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      sandbox.stub(feed, "readImpressionsPref").returns(fakeImpressions);

      const result = feed.filterSpocs(fakeSpocs);

      assert.equal(result.spocs.length, 1);
      assert.equal(result.spocs[0].campaign_id, "not-seen");
    });
  });

  describe("#isBelowFrequencyCap", () => {
    it("should return true if there are no campaign impressions", () => {
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      const fakeSpoc = {
        campaign_id: "not-seen",
        caps: {
          lifetime: 3,
          campaign: {
            count: 1,
            period: 1,
          },
        },
      };

      const result = feed.isBelowFrequencyCap(fakeImpressions, fakeSpoc);

      assert.isTrue(result);
    });
    it("should return true if there are no campaign caps", () => {
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      const fakeSpoc = {
        campaign_id: "seen",
        caps: {
          lifetime: 3,
        },
      };

      const result = feed.isBelowFrequencyCap(fakeImpressions, fakeSpoc);

      assert.isTrue(result);
    });

    it("should return false if lifetime cap is hit", () => {
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      const fakeSpoc = {
        campaign_id: "seen",
        caps: {
          lifetime: 1,
          campaign: {
            count: 3,
            period: 1,
          },
        },
      };

      const result = feed.isBelowFrequencyCap(fakeImpressions, fakeSpoc);

      assert.isFalse(result);
    });

    it("should return false if time based cap is hit", () => {
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      const fakeSpoc = {
        campaign_id: "seen",
        caps: {
          lifetime: 3,
          campaign: {
            count: 1,
            period: 1,
          },
        },
      };

      const result = feed.isBelowFrequencyCap(fakeImpressions, fakeSpoc);

      assert.isFalse(result);
    });
  });

  describe("#recordCampaignImpression", () => {
    it("should return false if time based cap is hit", () => {
      sandbox.stub(feed, "readImpressionsPref").returns({});
      sandbox.stub(feed, "writeImpressionsPref").returns();

      feed.recordCampaignImpression("seen");

      assert.calledWith(feed.writeImpressionsPref, SPOC_IMPRESSION_TRACKING_PREF, {"seen": [0]});
    });
  });

  describe("#cleanUpCampaignImpressionPref", () => {
    it("should remove campaign-3 because it is no longer being used", async () => {
      const fakeSpocs = {
        spocs: [
          {
            campaign_id: "campaign-1",
            caps: {
              lifetime: 3,
              campaign: {
                count: 1,
                period: 1,
              },
            },
          },
          {
            campaign_id: "campaign-2",
            caps: {
              lifetime: 3,
              campaign: {
                count: 1,
                period: 1,
              },
            },
          },
        ],
      };
      const fakeImpressions = {
        "campaign-2": [Date.now() - 1],
        "campaign-3": [Date.now() - 1],
      };
      sandbox.stub(feed, "readImpressionsPref").returns(fakeImpressions);
      sandbox.stub(feed, "writeImpressionsPref").returns();

      feed.cleanUpCampaignImpressionPref(fakeSpocs);

      assert.calledWith(feed.writeImpressionsPref, SPOC_IMPRESSION_TRACKING_PREF, {"campaign-2": [-1]});
    });
  });

  describe("#writeImpressionsPref", () => {
    it("should call Services.prefs.setStringPref", () => {
      sandbox.spy(feed.store, "dispatch");
      const fakeImpressions = {
        "foo": [Date.now() - 1],
        "bar": [Date.now() - 1],
      };

      feed.writeImpressionsPref(SPOC_IMPRESSION_TRACKING_PREF, fakeImpressions);

      assert.calledWithMatch(feed.store.dispatch, {
        data: {
          name: SPOC_IMPRESSION_TRACKING_PREF,
          value: JSON.stringify(fakeImpressions),
        },
        type: at.SET_PREF,
      });
    });
  });

  describe("#readImpressionsPref", () => {
    it("should return what's in Services.prefs.getStringPref", () => {
      const fakeImpressions = {
        "foo": [Date.now() - 1],
        "bar": [Date.now() - 1],
      };
      setPref(SPOC_IMPRESSION_TRACKING_PREF, fakeImpressions);

      const result = feed.readImpressionsPref(SPOC_IMPRESSION_TRACKING_PREF);

      assert.deepEqual(result, fakeImpressions);
    });
  });

  describe("#onAction: DISCOVERY_STREAM_SPOC_IMPRESSION", () => {
    it("should call dispatch to ac.AlsoToPreloaded with filtered spoc data", async () => {
      Object.defineProperty(feed, "showSpocs", {get: () => true});
      const fakeSpocs = {
        lastUpdated: 1,
        data: {
          spocs: [
            {
              campaign_id: "seen",
              caps: {
                lifetime: 3,
                campaign: {
                  count: 1,
                  period: 1,
                },
              },
            },
            {
              campaign_id: "not-seen",
              caps: {
                lifetime: 3,
                campaign: {
                  count: 1,
                  period: 1,
                },
              },
            },
          ],
        },
      };
      const fakeImpressions = {
        "seen": [Date.now() - 1],
      };
      const result = {
        spocs: [
          {
            campaign_id: "not-seen",
            caps: {
              lifetime: 3,
              campaign: {
                count: 1,
                period: 1,
              },
            },
          },
        ],
      };
      sandbox.stub(feed, "recordCampaignImpression").returns();
      sandbox.stub(feed, "readImpressionsPref").returns(fakeImpressions);
      sandbox.stub(feed.cache, "get").returns(Promise.resolve({spocs: fakeSpocs}));
      sandbox.spy(feed.store, "dispatch");

      await feed.onAction({type: at.DISCOVERY_STREAM_SPOC_IMPRESSION, data: {campaign_id: "seen"}});

      assert.deepEqual(feed.store.dispatch.firstCall.args[0].data.spocs, result);
    });
  });

  describe("#onAction: INIT", () => {
    it("should be .loaded=false before initialization", () => {
      assert.isFalse(feed.loaded);
    });
    it("should load data and set .loaded=true if config.enabled is true", async () => {
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      setPref(CONFIG_PREF_NAME, {enabled: true});
      sandbox.stub(feed, "loadLayout").returns(Promise.resolve());
      sandbox.stub(feed, "reportCacheAge").resolves();
      sandbox.spy(feed, "reportRequestTime");

      await feed.onAction({type: at.INIT});

      assert.calledOnce(feed.loadLayout);
      assert.calledOnce(feed.reportCacheAge);
      assert.calledOnce(feed.reportRequestTime);
      assert.isTrue(feed.loaded);
    });
  });

  describe("#onAction: DISCOVERY_STREAM_CONFIG_SET_VALUE", async () => {
    it("should add the new value to the pref without changing the existing values", async () => {
      sandbox.spy(feed.store, "dispatch");
      setPref(CONFIG_PREF_NAME, {enabled: true, other: "value"});

      await feed.onAction({type: at.DISCOVERY_STREAM_CONFIG_SET_VALUE, data: {name: "layout_endpoint", value: "foo.com"}});

      assert.calledWithMatch(feed.store.dispatch, {
        data: {
          name: CONFIG_PREF_NAME,
          value: JSON.stringify({enabled: true, other: "value", layout_endpoint: "foo.com"}),
        },
        type: at.SET_PREF,
      });
    });
    it("should disable opt-out when setting config enabled", () => {
      sandbox.spy(feed.store, "dispatch");

      feed.onAction({type: at.DISCOVERY_STREAM_CONFIG_SET_VALUE, data: {name: "enabled", value: true}});

      assert.calledWithMatch(feed.store.dispatch, {
        data: {
          name: "discoverystream.optOut.0",
          value: false,
        },
        type: at.SET_PREF,
      });
    });
  });

  describe("#onAction: DISCOVERY_STREAM_CONFIG_CHANGE", () => {
    it("should call this.loadLayout if config.enabled changes to true ", async () => {
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      // First initialize
      await feed.onAction({type: at.INIT});
      assert.isFalse(feed.loaded);

      // force clear cached pref value
      feed._prefCache = {};
      setPref(CONFIG_PREF_NAME, {enabled: true});

      sandbox.stub(feed, "clearCache").returns(Promise.resolve());
      sandbox.stub(feed, "loadLayout").returns(Promise.resolve());
      await feed.onAction({type: at.DISCOVERY_STREAM_CONFIG_CHANGE});

      assert.calledOnce(feed.loadLayout);
      assert.calledOnce(feed.clearCache);
      assert.isTrue(feed.loaded);
    });
    it("should clear the cache if a config change happens and config.enabled is true", async () => {
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      // force clear cached pref value
      feed._prefCache = {};
      setPref(CONFIG_PREF_NAME, {enabled: true});

      sandbox.stub(feed, "clearCache").returns(Promise.resolve());
      await feed.onAction({type: at.DISCOVERY_STREAM_CONFIG_CHANGE});

      assert.calledOnce(feed.clearCache);
    });
    it("should not call this.loadLayout if config.enabled changes to false", async () => {
      sandbox.stub(feed.cache, "set").returns(Promise.resolve());
      // force clear cached pref value
      feed._prefCache = {};
      setPref(CONFIG_PREF_NAME, {enabled: true});

      await feed.onAction({type: at.INIT});
      assert.isTrue(feed.loaded);

      feed._prefCache = {};
      setPref(CONFIG_PREF_NAME, {enabled: false});
      sandbox.stub(feed, "clearCache").returns(Promise.resolve());
      sandbox.stub(feed, "loadLayout").returns(Promise.resolve());
      await feed.onAction({type: at.DISCOVERY_STREAM_CONFIG_CHANGE});

      assert.notCalled(feed.loadLayout);
      assert.calledOnce(feed.clearCache);
      assert.isFalse(feed.loaded);
    });
  });

  describe("#onAction: DISCOVERY_STREAM_OPT_OUT", () => {
    it("should update opt-out pref", async () => {
      sandbox.spy(feed.store, "dispatch");

      await feed.onAction({type: at.DISCOVERY_STREAM_OPT_OUT});

      assert.calledWithMatch(feed.store.dispatch, {
        data: {
          name: "discoverystream.optOut.0",
          value: true,
        },
        type: at.SET_PREF,
      });
    });
  });

  describe("#onAction: UNINIT", () => {
    it("should reset pref cache", async () => {
      feed._prefCache = {cached: "value"};

      await feed.onAction({type: at.UNINIT});

      assert.deepEqual(feed._prefCache, {});
    });
  });

  describe("#onAction: PREF_CHANGED", () => {
    it("should update state.DiscoveryStream.config when the pref changes", async () => {
      setPref(CONFIG_PREF_NAME, {enabled: true, show_spocs: false, layout_endpoint: "foo"});

      assert.deepEqual(feed.store.getState().DiscoveryStream.config, {enabled: true, show_spocs: false, layout_endpoint: "foo"});
    });
    it("should handle pref changes when opt out changes", async () => {
      setPref(CONFIG_PREF_NAME, {enabled: true, show_spocs: false, layout_endpoint: "foo"});

      setPref("discoverystream.optOut.0", true);

      assert.deepEqual(feed.store.getState().DiscoveryStream.config, {enabled: false, show_spocs: false, layout_endpoint: "foo"});
    });
    it("should fire loadSpocs is showSponsored pref changes", async () => {
      sandbox.stub(feed, "loadSpocs").returns(Promise.resolve());

      await feed.onAction({type: at.PREF_CHANGED, data: {name: "showSponsored"}});

      assert.calledOnce(feed.loadSpocs);
    });
  });

  describe("#onAction: SYSTEM_TICK", () => {
    it("should not refresh if DiscoveryStream has not been loaded", async () => {
      sandbox.stub(feed, "refreshAll").resolves();
      setPref(CONFIG_PREF_NAME, {enabled: true});

      await feed.onAction({type: at.SYSTEM_TICK});
      assert.notCalled(feed.refreshAll);
    });

    it("should not refresh if no caches are expired", async () => {
      sandbox.stub(feed.cache, "set").resolves();
      setPref(CONFIG_PREF_NAME, {enabled: true});

      await feed.onAction({type: at.INIT});

      sandbox.stub(feed, "checkIfAnyCacheExpired").resolves(false);
      sandbox.stub(feed, "refreshAll").resolves();

      await feed.onAction({type: at.SYSTEM_TICK});
      assert.notCalled(feed.refreshAll);
    });

    it("should refresh if DiscoveryStream has been loaded at least once and a cache has expired", async () => {
      sandbox.stub(feed.cache, "set").resolves();
      setPref(CONFIG_PREF_NAME, {enabled: true});

      await feed.onAction({type: at.INIT});

      sandbox.stub(feed, "checkIfAnyCacheExpired").resolves(true);
      sandbox.stub(feed, "refreshAll").resolves();

      await feed.onAction({type: at.SYSTEM_TICK});
      assert.calledOnce(feed.refreshAll);
    });

    it("should refresh and not update open tabs if DiscoveryStream has been loaded at least once", async () => {
      sandbox.stub(feed.cache, "set").resolves();
      setPref(CONFIG_PREF_NAME, {enabled: true});

      await feed.onAction({type: at.INIT});

      sandbox.stub(feed, "checkIfAnyCacheExpired").resolves(true);
      sandbox.stub(feed, "refreshAll").resolves();

      await feed.onAction({type: at.SYSTEM_TICK});
      assert.calledWith(feed.refreshAll, {updateOpenTabs: false});
    });
  });

  describe("#onAction: PREF_SHOW_SPONSORED", () => {
    it("should call loadSpocs when preference changes", async () => {
      sandbox.stub(feed, "loadSpocs").resolves();
      sandbox.stub(feed.store, "dispatch");

      await feed.onAction({type: at.PREF_CHANGED, data: {name: "showSponsored"}});

      assert.calledOnce(feed.loadSpocs);
      const [dispatchFn] = feed.loadSpocs.firstCall.args;
      dispatchFn({});
      assert.calledWith(feed.store.dispatch, ac.BroadcastToContent({}));
    });
  });

  describe("#isExpired", () => {
    it("should throw if the key is not valid", () => {
      assert.throws(() => {
        feed.isExpired({}, "foo");
      });
    });
    it("should return false for layout on startup for content under 1 week", () => {
      const layout = {lastUpdated: Date.now()};
      const result = feed.isExpired({cachedData: {layout}, key: "layout", isStartup: true});

      assert.isFalse(result);
    });
    it("should return true for layout for isStartup=false", () => {
      const layout = {lastUpdated: Date.now()};
      clock.tick(THIRTY_MINUTES + 1);
      const result = feed.isExpired({cachedData: {layout}, key: "layout"});

      assert.isTrue(result);
    });
    it("should return true for layout on startup for content over 1 week", () => {
      const layout = {lastUpdated: Date.now()};
      clock.tick(ONE_WEEK + 1);
      const result = feed.isExpired({cachedData: {layout}, key: "layout", isStartup: true});

      assert.isTrue(result);
    });
  });

  describe("#checkIfAnyCacheExpired", () => {
    let cache;
    beforeEach(() => {
      cache = {
        layout: {lastUpdated: Date.now()},
        feeds: {"foo.com": {lastUpdated: Date.now()}},
        spocs: {lastUpdated: Date.now()},
      };
      sandbox.stub(feed.cache, "get").resolves(cache);
    });

    it("should return false if nothing in the cache is expired", async () => {
      const result = await feed.checkIfAnyCacheExpired();
      assert.isFalse(result);
    });

    it("should return true if .layout is missing", async () => {
      delete cache.layout;
      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });
    it("should return true if .layout is expired", async () => {
      clock.tick(THIRTY_MINUTES + 1);
      // Update other caches we aren't testing
      cache.feeds["foo.com"].lastUpdate = Date.now();
      cache.spocs.lastUpdate = Date.now();

      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });

    it("should return true if .spocs is missing", async () => {
      delete cache.spocs;
      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });
    it("should return true if .spocs is expired", async () => {
      clock.tick(THIRTY_MINUTES + 1);
      // Update other caches we aren't testing
      cache.layout.lastUpdated = Date.now();
      cache.feeds["foo.com"].lastUpdate = Date.now();

      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });

    it("should return true if .feeds is missing", async () => {
      delete cache.feeds;
      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });
    it("should return true if data for .feeds[url] is missing", async () => {
      cache.feeds["foo.com"] = null;
      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });
    it("should return true if data for .feeds[url] is expired", async () => {
      clock.tick(THIRTY_MINUTES + 1);
      // Update other caches we aren't testing
      cache.layout.lastUpdated = Date.now();
      cache.spocs.lastUpdate = Date.now();
      assert.isTrue(await feed.checkIfAnyCacheExpired());
    });
  });

  describe("#refreshAll", () => {
    beforeEach(() => {
      sandbox.stub(feed, "loadLayout").resolves();
      sandbox.stub(feed, "loadComponentFeeds").resolves();
      sandbox.stub(feed, "loadSpocs").resolves();
      sandbox.spy(feed.store, "dispatch");
      Object.defineProperty(feed, "showSpocs", {get: () => true});
    });

    it("should call layout, component, spocs update and telemetry reporting functions", async () => {
      await feed.refreshAll();

      assert.calledOnce(feed.loadLayout);
      assert.calledOnce(feed.loadComponentFeeds);
      assert.calledOnce(feed.loadSpocs);
    });
    it("should pass in dispatch wrapped with broadcast if options.updateOpenTabs is true", async () => {
      await feed.refreshAll({updateOpenTabs: true});
      [feed.loadLayout, feed.loadComponentFeeds, feed.loadSpocs]
        .forEach(fn => {
          assert.calledOnce(fn);
          const result = fn.firstCall.args[0]({type: "FOO"});
          assert.isTrue(au.isBroadcastToContent(result));
        });
    });
    it("should pass in dispatch with regular actions if options.updateOpenTabs is false", async () => {
      await feed.refreshAll({updateOpenTabs: false});
      [feed.loadLayout, feed.loadComponentFeeds, feed.loadSpocs]
        .forEach(fn => {
          assert.calledOnce(fn);
          const result = fn.firstCall.args[0]({type: "FOO"});
          assert.deepEqual(result, {type: "FOO"});
        });
    });
    it("should set loaded to true if loadSpocs and loadComponentFeeds fails", async () => {
      feed.loadComponentFeeds.rejects("loadComponentFeeds error");
      feed.loadSpocs.rejects("loadSpocs error");

      await feed.refreshAll();

      assert.isTrue(feed.loaded);
    });
    it("should call loadComponentFeeds and loadSpocs in Promise.all", async () => {
      sandbox.stub(global.Promise, "all").resolves();

      await feed.refreshAll();

      assert.calledOnce(global.Promise.all);
      const {args} = global.Promise.all.firstCall;
      assert.equal(args[0].length, 2);
    });
    describe("test startup cache behaviour", () => {
      beforeEach(() => {
        feed._maybeUpdateCachedData.restore();
        sandbox.stub(feed.cache, "set").resolves();
      });
      it("should refresh layout on startup if it was served from cache", async () => {
        feed.loadLayout.restore();
        sandbox.stub(feed.cache, "get").resolves({layout: {lastUpdated: Date.now(), layout: {}}});
        sandbox.stub(feed, "fetchFromEndpoint").resolves({layout: {}});
        clock.tick(THIRTY_MINUTES + 1);

        await feed.refreshAll({isStartup: true});

        assert.calledOnce(feed.fetchFromEndpoint);
        // Once from cache, once to update the store
        assert.calledTwice(feed.store.dispatch);
        assert.equal(feed.store.dispatch.firstCall.args[0].type, at.DISCOVERY_STREAM_LAYOUT_UPDATE);
      });
      it("should not refresh layout on startup if it is under THIRTY_MINUTES", async () => {
        feed.loadLayout.restore();
        sandbox.stub(feed.cache, "get").resolves({layout: {lastUpdated: Date.now(), layout: {}}});
        sandbox.stub(feed, "fetchFromEndpoint").resolves({layout: {}});

        await feed.refreshAll({isStartup: true});

        assert.notCalled(feed.fetchFromEndpoint);
      });
      it("should refresh spocs on startup if it was served from cache", async () => {
        feed.loadSpocs.restore();
        sandbox.stub(feed.cache, "get").resolves({spocs: {lastUpdated: Date.now()}});
        sandbox.stub(feed, "fetchFromEndpoint").resolves("data");
        clock.tick(THIRTY_MINUTES + 1);

        await feed.refreshAll({isStartup: true});

        assert.calledOnce(feed.fetchFromEndpoint);
        // Once from cache, once to update the store
        assert.calledTwice(feed.store.dispatch);
        assert.equal(feed.store.dispatch.firstCall.args[0].type, at.DISCOVERY_STREAM_SPOCS_UPDATE);
      });
      it("should not refresh spocs on startup if it is under THIRTY_MINUTES", async () => {
        feed.loadSpocs.restore();
        sandbox.stub(feed.cache, "get").resolves({spocs: {lastUpdated: Date.now()}});
        sandbox.stub(feed, "fetchFromEndpoint").resolves("data");

        await feed.refreshAll({isStartup: true});

        assert.notCalled(feed.fetchFromEndpoint);
      });
      it("should refresh feeds on startup if it was served from cache", async () => {
        feed.loadComponentFeeds.restore();

        const fakeComponents = {components: [{feed: {url: "foo.com"}}]};
        const fakeLayout = [fakeComponents];
        const fakeDiscoveryStream = {DiscoveryStream: {layout: fakeLayout}};
        sandbox.stub(feed.store, "getState").returns(fakeDiscoveryStream);

        const fakeCache = {feeds: {"foo.com": {lastUpdated: Date.now(), data: "data"}}};
        sandbox.stub(feed.cache, "get").resolves(fakeCache);
        clock.tick(THIRTY_MINUTES + 1);
        sandbox.stub(feed, "fetchFromEndpoint").resolves("data");

        await feed.refreshAll({isStartup: true});

        assert.calledOnce(feed.fetchFromEndpoint);
        // Once from cache, once to update the store
        assert.calledTwice(feed.store.dispatch);
        assert.equal(feed.store.dispatch.firstCall.args[0].type, at.DISCOVERY_STREAM_FEEDS_UPDATE);
      });
    });
  });

  describe("#reportCacheAge", () => {
    let cache;
    const cacheAge = 30;
    beforeEach(() => {
      cache = {
        layout: {lastUpdated: Date.now() - 10 * 1000},
        feeds: {"foo.com": {lastUpdated: Date.now() - cacheAge * 1000}},
        spocs: {lastUpdated: Date.now() - 20 * 1000},
      };
      sandbox.stub(feed.cache, "get").resolves(cache);
    });

    it("should report the oldest lastUpdated date as the cache age", async () => {
      sandbox.spy(feed.store, "dispatch");
      feed.loaded = false;
      await feed.reportCacheAge();

      assert.calledOnce(feed.store.dispatch);

      const [action] = feed.store.dispatch.firstCall.args;
      assert.equal(action.type, at.TELEMETRY_PERFORMANCE_EVENT);
      assert.equal(action.data.event, "DS_CACHE_AGE_IN_SEC");
      assert.isAtLeast(action.data.value, cacheAge);
      feed.loaded = true;
    });
  });

  describe("#reportRequestTime", () => {
    let cache;
    const cacheAge = 30;
    beforeEach(() => {
      cache = {
        layout: {lastUpdated: Date.now() - 10 * 1000},
        feeds: {"foo.com": {lastUpdated: Date.now() - cacheAge * 1000}},
        spocs: {lastUpdated: Date.now() - 20 * 1000},
      };
      sandbox.stub(feed.cache, "get").resolves(cache);
    });

    it("should report all the request times", async () => {
      sandbox.spy(feed.store, "dispatch");
      feed.loaded = false;
      feed.layoutRequestTime = 1000;
      feed.spocsRequestTime = 2000;
      feed.componentFeedRequestTime = 3000;
      feed.totalRequestTime = 5000;
      feed.reportRequestTime();

      assert.equal(feed.store.dispatch.callCount, 4);

      let [action] = feed.store.dispatch.getCall(0).args;
      assert.equal(action.type, at.TELEMETRY_PERFORMANCE_EVENT);
      assert.equal(action.data.event, "LAYOUT_REQUEST_TIME");
      assert.equal(action.data.value, 1000);

      [action] = feed.store.dispatch.getCall(1).args;
      assert.equal(action.type, at.TELEMETRY_PERFORMANCE_EVENT);
      assert.equal(action.data.event, "SPOCS_REQUEST_TIME");
      assert.equal(action.data.value, 2000);

      [action] = feed.store.dispatch.getCall(2).args;
      assert.equal(action.type, at.TELEMETRY_PERFORMANCE_EVENT);
      assert.equal(action.data.event, "COMPONENT_FEED_REQUEST_TIME");
      assert.equal(action.data.value, 3000);

      [action] = feed.store.dispatch.getCall(3).args;
      assert.equal(action.type, at.TELEMETRY_PERFORMANCE_EVENT);
      assert.equal(action.data.event, "DS_FEED_TOTAL_REQUEST_TIME");
      assert.equal(action.data.value, 5000);
      feed.loaded = true;
    });
  });
});
