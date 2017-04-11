"use strict";
const {TopSitesFeed, UPDATE_TIME} = require("lib/TopSitesFeed.jsm");
const {GlobalOverrider} = require("test/unit/utils");
const action = {meta: {fromTarget: {}}};
const {actionTypes: at} = require("common/Actions.jsm");

describe("Top Sites Feed", () => {
  let feed;
  let globals;
  let link;
  let clock;
  before(() => {
    globals = new GlobalOverrider();
    globals.set("PlacesProvider", {links: {getLinks: globals.sandbox.spy(() => Promise.resolve(link))}});
    globals.set("PreviewProvider", {getThumbnail: globals.sandbox.spy(() => Promise.resolve())});
  });
  beforeEach(() => {
    feed = new TopSitesFeed();
    feed.store = {dispatch: sinon.spy(), getState() { return {TopSites: {rows: Array(12).fill("site")}}; }};
    link = [{url: "https://www.example.com"}];
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    globals.reset();
    clock.restore();
  });
  after(() => globals.restore());

  it("should get the links from Places Provider", () => (
    feed.getData(action).then(() => {
      assert.calledOnce(global.PlacesProvider.links.getLinks);
    })
  ));
  it("should not throw if there are no links", () => {
    link = null;
    assert.doesNotThrow(() => {
      feed.getData(action);
    });
  });
  it("should get a screenshot from Preview Provider", () => (
    feed.getData(action).then(() => {
      assert.calledOnce(global.PreviewProvider.getThumbnail);
    })
  ));
  it("should dispatch two actions", () => (
    feed.getData(action).then(() => {
      assert.calledTwice(feed.store.dispatch);
    })
  ));
  it("should call getData if there are not enough sites on NEW_TAB_LOAD", () => {
    feed.store.getState = function() { return {TopSites: {rows: []}}; };
    sinon.stub(feed, "getData");
    feed.onAction({type: at.NEW_TAB_LOAD});
    assert.calledOnce(feed.getData);
  });
  it("should not call getData if there are enough sites on NEW_TAB_LOAD", () => {
    feed.lastUpdated = Date.now();
    sinon.stub(feed, "getData");
    feed.onAction({type: at.NEW_TAB_LOAD});
    assert.notCalled(feed.getData);
  });
  it("should call getData if .lastUpdated is too old on NEW_TAB_LOAD", () => {
    feed.lastUpdated = 0;
    clock.tick(UPDATE_TIME);
    sinon.stub(feed, "getData");
    feed.onAction({type: at.NEW_TAB_LOAD});
    assert.calledOnce(feed.getData);
  });
  it("should not call getData if .lastUpdated is less than update time on NEW_TAB_LOAD", () => {
    feed.lastUpdated = 0;
    clock.tick(UPDATE_TIME - 1);
    sinon.stub(feed, "getData");
    feed.onAction({type: at.NEW_TAB_LOAD});
    assert.notCalled(feed.getData);
  });
});
