const injector = require("inject!addon/PerfMeter");
const {SimplePrefs} = require("shims/sdk/simple-prefs");
const {Tabs, Tab} = require("shims/sdk/tabs");
const {WORKER_ATTACHED_EVENT} = require("common/constants");

// This is the event that indicates a tab has completely loaded
// it should actually be store as a constant somwhere else...
const LOAD_COMPLETE_EVENT = "NEWTAB_RENDER";
const TEST_URL = "foo.com";

describe("PerfMeter", () => {
  let perfMeter;
  let tabs;
  let simplePrefs;

  function setup(prefs = {"performance.log": true}) {
    tabs = new Tabs();
    simplePrefs = new SimplePrefs(prefs);
    const {PerfMeter} = injector({"sdk/tabs": tabs, "sdk/simple-prefs": simplePrefs});
    perfMeter = new PerfMeter([TEST_URL]);
  }

  beforeEach(setup);
  afterEach(() => {
    perfMeter.uninit();
  });
  it("should listen to tabs 'open' event ", () => {
    assert.calledWith(tabs.on, "open", perfMeter.onOpen);
  });
  it("should listen to pref changes for performance.log", () => {
    assert.calledWith(simplePrefs.on, "performance.log", perfMeter.onPrefChange);
  });
  it("should set ._active to whatever performance.log pref is set to", () => {
    assert.equal(perfMeter._active, true);
    setup({"performance.log": false});
    assert.equal(perfMeter._active, false);
  });
  describe(".events", () => {
    it("should return ._tabs", () => {
      assert.equal(perfMeter.events, perfMeter._tabs);
    });
  });
  describe("#_addSampleValue", () => {
    it("should add the right values to ._stats", () => {
      perfMeter._addSampleValue(5);
      assert.deepEqual(perfMeter._stats, {sum: 5, squareSum: 25, samples: [5]});
    });
  });
  describe("#_isLoadCompleteEvent", () => {
    it(`should should return true for ${LOAD_COMPLETE_EVENT}`, () => {
      assert.isTrue(perfMeter._isLoadCompleteEvent({data: LOAD_COMPLETE_EVENT}));
    });
    it("should return false for other events", () => {
      assert.isFalse(perfMeter._isLoadCompleteEvent({data: null}));
      assert.isFalse(perfMeter._isLoadCompleteEvent({data: "FOO"}));
    });
  });
  describe("#_twoDigitsRound", () => {
    it("should round a number to 2 decimals", () => {
      assert.equal(perfMeter._twoDigitsRound(12.557), 12.56);
    });
  });
  describe("#_computeStats", () => {
    const addValues = (...vals) => vals.forEach(n => perfMeter._addSampleValue(n));
    it("should return an object", () => {
      assert.isObject(perfMeter._computeStats());
    });
    it("should calculate .total (the # of events)", () => {
      addValues(20, 10, 5);
      assert.equal(perfMeter._computeStats().total, 3);
    });
    it("should calculate .mean rounded to 2 digits", () => {
      addValues(20, 10, 5);
      assert.equal(perfMeter._computeStats().mean, 11.67);
    });
    it("should caculate the .std (standard deviation) rounded to 2 digits", () => {
      addValues(10, 10, 10);
      assert.equal(perfMeter._computeStats().std, 0);
      addValues(25, 25, 25);
      assert.equal(perfMeter._computeStats().std, 7.5);
    });
    it("should calculate .median", () => {
      addValues(1, 2, 100);
      assert.equal(perfMeter._computeStats().median, 2);
      addValues(0);
      assert.equal(perfMeter._computeStats().median, 1.5);
    });
  });
  describe("#uninit", () => {
    it("should call .clearTabs", () => {
      sinon.spy(perfMeter, "clearTabs");
      perfMeter.uninit();
      assert.called(perfMeter.clearTabs);
    });
    it("should remove listener for tabs opening", () => {
      perfMeter.uninit();
      assert.calledWith(tabs.off, "open", perfMeter.onOpen);
    });
    it("should remove listener for prefs changes", () => {
      perfMeter.uninit();
      assert.calledWith(simplePrefs.off, "performance.log", perfMeter.onPrefChange);
    });
  });
  describe("#clearTabs", () => {
    it("should reset ._tabs", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onOpen(tab);
      assert.property(perfMeter._tabs, tab.id);
      perfMeter.clearTabs();
      assert.deepEqual(perfMeter._tabs, {});
    });
    it("should remove listeners for all tabs", () => {
      tabs = [
        new Tab({url: TEST_URL}),
        new Tab({url: TEST_URL})
      ];
      tabs.forEach(tab => perfMeter.onOpen(tab));
      perfMeter.clearTabs();
      tabs.forEach(tab => {
        assert.calledWith(tab.off, "ready", perfMeter.onReady);
        assert.calledWith(tab.off, "close", perfMeter.onClose);
      });
    });
  });
  describe("#onPrefChange", () => {
    it("should set ._active", () => {
      assert.isTrue(perfMeter._active);
      simplePrefs.prefs["performance.log"] = false;
      perfMeter.onPrefChange();
      assert.isFalse(perfMeter._active);
    });
  });
  describe("#isActivityStreamsURL", () => {
    it("should return true for URLs in trackableURLs", () => {
      assert.isTrue(perfMeter.isActivityStreamsURL(TEST_URL));
    });
    it("should return false for other URLs ", () => {
      assert.isFalse(perfMeter.isActivityStreamsURL("asdasd.com"));
    });
  });
  describe("#onOpen", () => {
    let tab;
    function setupOpen() {
      tab = new Tab({url: TEST_URL});
      perfMeter.onOpen(tab);
    }
    beforeEach(setupOpen);
    it("should add an object at ._tabs[id], where id is the id of tab", () => {
      const tabData = perfMeter._tabs[tab.id];
      assert.isObject(tabData);
      assert.equal(tabData.tab, tab);
      assert.isNumber(tabData.openAt);
      assert.isArray(tabData.events);
      assert.instanceOf(tabData.requests, Map);
      assert.isFalse(tabData.workerWasAttached);
    });
    it("should add one event (TAB_OPEN to ._tabs[id].events", () => {
      const expectedEvent = {tag: "TAB_OPEN", start: 0};
      assert.deepEqual(perfMeter._tabs[tab.id].events, [expectedEvent]);
    });
    it("should add onReady listener to the tab", () => {
      assert.calledWith(tab.on, "ready", perfMeter.onReady);
    });
    it("should add onClose listener to the tab", () => {
      assert.calledWith(tab.on, "close", perfMeter.onClose);
    });
    it("should call .displayItem", () => {
      sinon.spy(perfMeter, "displayItem");
      setupOpen();
      assert.calledWith(perfMeter.displayItem, tab.id, {tag: "TAB_OPEN", start: 0});
    });
  });
  describe("#onReady", () => {
    it("should log TAB_READY", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onReady(tab);
      sinon.spy(perfMeter, "log");
      perfMeter.onReady(tab);
      assert.calledWith(perfMeter.log, tab, "TAB_READY");
    });
    it("should remove tab ready listener", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onReady(tab);
      assert.calledWith(tab.off, "ready", perfMeter.onReady);
    });
    it("should delete tab from ._tabs if not in trackableURLs", () => {
      const tab = new Tab({url: "asdasd.com"});
      // onOpen adds it to ._tabs
      perfMeter.onOpen(tab);
      assert.property(perfMeter._tabs, tab.id);
      perfMeter.onReady(tab);
      assert.notProperty(perfMeter._tabs, tab.id);
    });
  });
  describe("#onClose", () => {
    it("should delete tab from ._tabs ", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onOpen(tab);
      assert.property(perfMeter._tabs, tab.id);
      perfMeter.onClose(tab);
      assert.notProperty(perfMeter._tabs, tab.id);
    });
    it("should remove tab ready listener", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onClose(tab);
      assert.calledWith(tab.off, "ready", perfMeter.onReady);
    });
  });
  describe("#log", () => {
    // Helps set up a tab and open it
    function setupTab(options = {}) {
      const tab = new Tab(Object.assign({url: TEST_URL}, options));
      perfMeter.onOpen(tab);
      return tab;
    }
    it("should add event to _tabs[id].events with .tag, .data, and .start", () => {
      const tab = setupTab();
      const tabData = perfMeter._tabs[tab.id];
      perfMeter.log(tab, "NOTIFY_PERFORMANCE", 42);
      const matches = tabData.events.filter(e => e.tag === "NOTIFY_PERFORMANCE");
      const event = matches[0];
      assert.lengthOf(matches, 1);
      assert.equal(event.tag, "NOTIFY_PERFORMANCE");
      assert.equal(event.data, 42);
      assert.isNumber(event.start);
    });
    it("should call .displayItem", () => {
      const tab = setupTab();
      sinon.spy(perfMeter, "displayItem");
      perfMeter.log(tab, "NOTIFY_PERFORMANCE", 42);
      const event = perfMeter._tabs[tab.id].events.filter(e => e.tag === "NOTIFY_PERFORMANCE")[0];
      assert.calledWith(perfMeter.displayItem, tab.id, event);
    });
    it(`should call ._addSampleValue if the event.data is ${LOAD_COMPLETE_EVENT}`, () => {
      const tab = setupTab();
      sinon.spy(perfMeter, "_addSampleValue");
      perfMeter.log(tab, "NOTIFY_PERFORMANCE", LOAD_COMPLETE_EVENT);
      assert.called(perfMeter._addSampleValue);
    });
    it("should call .onOpen if tab is not found in ._tabs", () => {
      sinon.spy(perfMeter, "onOpen");
      const tab = new Tab({url: TEST_URL});
      perfMeter.log(tab, "NOTIFY_PERFORMANCE", 42);
      assert.calledOnce(perfMeter.onOpen);
    });
    it("should set .workerWasAttached if tag is WORKER_ATTACHED", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.log(tab, WORKER_ATTACHED_EVENT);
      assert.isTrue(perfMeter._tabs[tab.id].workerWasAttached);
    });
    it("should replace tabData if tag is WORKER_ATTACHED and workerWasAttached is true", () => {
      const tab = new Tab({url: TEST_URL});
      perfMeter.onOpen(tab);
      const tabData = perfMeter._tabs[tab.id];
      const {openAt} = tabData;
      tabData.workerWasAttached = true;
      perfMeter.log(tab, WORKER_ATTACHED_EVENT);

      assert.include(tabData.events.map(e => e.tag), "TAB_RELOAD");
      assert.include(tabData.events.map(e => e.tag), "TAB_READY");
      assert.deepEqual(tabData.requests, new Map());
      assert.isAtLeast(tabData.openAt, openAt);
    });
    it("should not log events for non-trackableURLs", () => {
      const tab = setupTab({url: "asdasd.com"});
      perfMeter.log(tab, "NOTIFY_PERFORMANCE", 42);
      assert.lengthOf(perfMeter._tabs[tab.id].events.filter(e => e.tag === "NOTIFY_PERFORMANCE"), 0);
    });
    it("should not log events for tags not in VALID_TELEMETRY_TAGS", () => {
      const tab = setupTab();
      perfMeter.log(tab, "FOO", 42);
      assert.lengthOf(perfMeter._tabs[tab.id].events.filter(e => e.tag === "FOO"), 0);
    });
  });
});
