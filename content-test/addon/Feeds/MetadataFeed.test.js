"use strict";

const testLinks = [{url: "foo.com"}, {url: "bar.com"}];
const testTopSites = [{url: "example1.com"}, {url: "example2.com"}];
const fetchNewMetadata = () => (Promise.resolve());
const fetchNewMetadataLocally = () => (Promise.resolve());
const pinnedLinks = {
  links: [],
  pin: sinon.spy(),
  unpin: sinon.spy(),
  isPinned: site => false
};
const PlacesProvider = {
  links: {
    getRecentlyVisited: sinon.spy(() => Promise.resolve(testLinks)),
    getTopFrecentSites: sinon.spy(() => Promise.resolve(testTopSites))
  }
};

describe("MetadataFeed", () => {
  let MetadataFeed;
  let instance;
  beforeEach(() => {
    MetadataFeed = require("inject!addon/Feeds/MetadataFeed")({"addon/PlacesProvider": {PlacesProvider}});
    Object.keys(PlacesProvider.links).forEach(k => PlacesProvider.links[k].reset());
    instance = new MetadataFeed({fetchNewMetadata, fetchNewMetadataLocally, pinnedLinks});
    instance.store = {getState: () => ({Experiments: {values: {metadataNoService: false}}})};
    instance.refresh = sinon.spy();
    sinon.spy(instance.options, "fetchNewMetadata");
    sinon.spy(instance.options, "fetchNewMetadataLocally");
  });
  it("should create a MetadataFeed", () => {
    assert.instanceOf(instance, MetadataFeed);
  });
  it("should have a MAX_NUM_LINKS of 5", () => {
    assert.equal(MetadataFeed.MAX_NUM_LINKS, 5);
  });
  it("should create an empty array to start for links to fetch", () => {
    assert.equal(instance.urlsToFetch.length, 0);
  });
  describe("#getInitialMetadata", () => {
    beforeEach(() => {
      instance.refresh = sinon.spy();
    });

    it("should get TopFrecentSites metadata then RecentlyVisited metadata", () => {
      instance.pinnedLinks.links = [
        null,
        {url: "https://github.com/mozilla/activity-stream"},
        null,
        null,
        {url: "https://mozilla.org"}];
      return instance.getInitialMetadata().then(() => {
        assert.called(PlacesProvider.links.getTopFrecentSites);
        assert.called(PlacesProvider.links.getRecentlyVisited);
        assert.calledThrice(instance.refresh);
        assert.equal(instance.urlsToFetch.length, 6);
      });
    });
  });
  describe("#getData", () => {
    it("should run sites through fetchNewMetadata", () => instance.getData().then(() => (
        assert.calledOnce(instance.options.fetchNewMetadata)))
    );
    it("should run sites through fetchNewMetadataLocally if experiment pref is on", () => {
      instance.store = {getState: () => ({Experiments: {values: {metadataNoService: true}}})};
      return instance.getData().then(() => {
        assert.notCalled(instance.options.fetchNewMetadata);
        assert.calledOnce(instance.options.fetchNewMetadataLocally);
      });
    });
    it("should resolve with an action, but no data", () => (
      instance.getData().then(action => {
        assert.isObject(action);
        assert.equal(action.type, "METADATA_UPDATED");
        assert.isUndefined(action.data);
      })
    ));
    it("should empty the map when we've exceeded the max number of links", () => {
      const links = [
        {url: "example.com/1"},
        {url: "example.com/2"},
        {url: "example.com/3"},
        {url: "example.com/4"},
        {url: "example.com/5"},
        {url: "example.com/6"}];
      links.forEach(item => instance.urlsToFetch.push(item.url));
      assert.equal(instance.urlsToFetch.length, 6);
      return instance.getData().then(() => assert.equal(instance.urlsToFetch.length, 0));
    });
  });
  describe("#onAction", () => {
    beforeEach(() => {
      instance.refresh = sinon.spy();
    });
    it("should call getInitialMetadata for any existing sites on APP_INIT", () => {
      instance.getInitialMetadata = sinon.spy();
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledWith(instance.getInitialMetadata, "app was initializing");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if we don't need metadata for sites", () => {
      testLinks.forEach(item => instance.urlsToFetch.push(item.url));
      assert.equal(instance.urlsToFetch.length, 2);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: {url: "baz.com"}});
      assert.notCalled(instance.refresh);
    });
    it("should collect the url on RECEIVE_PLACES_CHANGES", () => {
      const linkToAdd = {url: "newURL.com"};
      return new Promise(resolve => {
        assert.equal(instance.urlsToFetch.length, 0);
        instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: linkToAdd});
        resolve();
      }).then(() => {
        assert.equal(instance.urlsToFetch.length, 1);
        assert.ok(instance.urlsToFetch.indexOf(linkToAdd.url) > -1);
      });
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if we need metadata for sites", () => {
      const links = [{url: "example.com/1"}, {url: "example.com/2"}, {url: "example.com/3"}, {url: "example.com/4"}, {url: "example.com/5"}];
      links.forEach(item => instance.urlsToFetch.push(item.url));
      assert.equal(instance.urlsToFetch.length, 5);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: {url: "example.com/6"}});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "metadata was needed for these links");
    });
    it("should call getInitialMetadata on RECEIVE_PLACES_CHANGES if we are in the refresh experiment and enough time has expired", () => {
      instance.store = {getState: () => ({Experiments: {values: {metadataNoService: false}}})};
      instance.getInitialMetadata = sinon.spy();
      instance.lastRefreshed = Date.now() - MetadataFeed.UPDATE_TIME - 5000;
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: {url: "example.com/"}});
      assert.calledWith(instance.getInitialMetadata, "periodically refreshing metadata");
    });
  });
});
