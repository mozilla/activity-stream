/* globals sinon, require, assert */
"use strict";

const simplePrefs = require("sdk/simple-prefs");
const testLinks = [{url: "foo.com"}, {url: "bar.com"}];
const testTopSites = [{url: "example1.com"}, {url: "example2.com"}];
const fetchNewMetadata = () => (Promise.resolve());
const fetchNewMetadataLocally = () => (Promise.resolve());

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
    instance = new MetadataFeed({fetchNewMetadata, fetchNewMetadataLocally});
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
  it("should create an empty map to start for links to fetch", () => {
    assert.equal(instance.linksToFetch.size, 0);
  });
  describe("#getInitialMetadata", () => {
    beforeEach(() => {
      instance.refresh = sinon.spy();
    });

    it("should get TopFrecentSites metadata then RecentlyVisited metadata", () =>
      instance.getInitialMetadata().then(() => {
        assert.called(PlacesProvider.links.getTopFrecentSites);
        assert.called(PlacesProvider.links.getRecentlyVisited);
        assert.calledTwice(instance.refresh);
        assert.equal(instance.linksToFetch.size, 4);
      })
    );
  });
  describe("#getData", () => {
    it("should run sites through fetchNewMetadata", () => instance.getData().then(() => (
        assert.calledOnce(instance.options.fetchNewMetadata)))
    );
    it("should run sites through fetchNewMetadataLocally if experiment pref is on", () => {
      simplePrefs.prefs["experiments.locallyFetchMetadata20"] = true;
      return instance.getData().then(() => {
        assert.notCalled(instance.options.fetchNewMetadata);
        assert.calledOnce(instance.options.fetchNewMetadataLocally);
        simplePrefs.prefs["experiments.locallyFetchMetadata20"] = false;
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
      links.forEach(item => instance.linksToFetch.set(item.url, Date.now()));
      assert.equal(instance.linksToFetch.size, 6);
      return instance.getData().then(() => assert.equal(instance.linksToFetch.size, 0));
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
      testLinks.forEach(item => instance.linksToFetch.set(item.url, Date.now()));
      assert.equal(instance.linksToFetch.size, 2);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: {url: "baz.com"}});
      assert.notCalled(instance.refresh);
    });
    it("should collect the url on RECEIVE_PLACES_CHANGES", () => {
      const linkToAdd = {url: "newURL.com"};
      return new Promise(resolve => {
        assert.equal(instance.linksToFetch.size, 0);
        instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: linkToAdd});
        resolve();
      }).then(() => {
        assert.equal(instance.linksToFetch.size, 1);
        assert.ok(instance.linksToFetch.get(linkToAdd.url));
      });
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if we need metadata for sites", () => {
      const links = [{url: "example.com/1"}, {url: "example.com/2"}, {url: "example.com/3"}, {url: "example.com/4"}, {url: "example.com/5"}];
      links.forEach(item => instance.linksToFetch.set(item.url, Date.now()));
      assert.equal(instance.linksToFetch.size, 5);
      instance.onAction({}, {type: "RECEIVE_PLACES_CHANGES", data: {url: "example.com/6"}});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "metadata was needed for these links");
    });
  });
});
