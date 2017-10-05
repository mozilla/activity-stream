"use strict";

const {PersistentCache} = require("lib/PersistentCache.jsm");
const {GlobalOverrider} = require("test/unit/utils");

describe("PersistentCache", () => {
  let fakeOS;
  let fakeTextDecoder;
  let cache;
  let filename = "cache.json";
  let globals;

  beforeEach(() => {
    globals = new GlobalOverrider();
    fakeOS = {
      Constants: {Path: {localProfileDir: "/foo/bar"}},
      File: {
        exists: async () => true,
        read: async () => ({}),
        writeAtomic: sinon.spy()
      },
      Path: {join: () => filename}
    };
    fakeTextDecoder = {decode: () => "{\"foo\": \"bar\"}"};
    globals.set("OS", fakeOS);
    globals.set("gTextDecoder", fakeTextDecoder);
    globals.set("gInMemoryCache", new Map());
    globals.set("gFilesLoaded", []);

    cache = new PersistentCache(filename);
  });

  describe("#get", () => {
    it("tries to read the file on the first get", async () => {
      fakeOS.File.read = sinon.spy();
      await cache.get("foo");
      assert.calledOnce(fakeOS.File.read);
    });
    it("doesnt try to read the file if it doesn't exist", async () => {
      fakeOS.File.read = sinon.spy();
      fakeOS.File.exists = async () => false;
      await cache.get("foo");
      assert.notCalled(fakeOS.File.read);
    });
    it("doesnt try to read the file if it was already loaded", async () => {
      fakeOS.File.read = sinon.spy();
      await cache.loadFromFile();
      fakeOS.File.read.reset();
      await cache.get("foo");
      assert.notCalled(fakeOS.File.read);
    });
    it("returns data for a given cache key", async () => {
      let value = await cache.get("foo");
      assert.equal(value, "bar");
    });
    it("returns undefined for a cache key that doesn't exist", async () => {
      let value = await cache.get("baz");
      assert.equal(value, undefined);
    });
    it("returns all the data if no cache key is specified", async () => {
      let value = await cache.get();
      assert.deepEqual(value, {foo: "bar"});
    });
  });

  describe("#set", () => {
    it("sets a string value", async () => {
      const key = "testkey";
      const value = "testvalue";
      cache.set(key, value);
      const cachedValue = await cache.get(key);
      assert.equal(cachedValue, value);
    });
    it("sets an object value", async () => {
      const key = "testkey";
      const value = {x: 1, y: 2, z: 3};
      cache.set(key, value);
      const cachedValue = await cache.get(key);
      assert.deepEqual(cachedValue, value);
    });
    it("writes the data to file", async () => {
      const key = "testkey";
      const value = {x: 1, y: 2, z: 3};
      fakeOS.File.exists = async () => false;
      cache.set(key, value);
      assert.calledOnce(fakeOS.File.writeAtomic);
      assert.calledWith(fakeOS.File.writeAtomic, filename, `{"testkey":{"x":1,"y":2,"z":3}}`, {tmpPath: `${filename}.tmp`});
    });
  });
});
