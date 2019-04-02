import {GlobalOverrider} from "test/unit/utils";
import {PersistentCache} from "lib/PersistentCache.jsm";

describe("PersistentCache", () => {
  let fakeOS;
  let fakeTextDecoder;
  let cache;
  let filename = "cache.json";
  let reportErrorStub;
  let globals;
  let sandbox;

  beforeEach(() => {
    globals = new GlobalOverrider();
    sandbox = sinon.createSandbox();
    fakeOS = {
      Constants: {Path: {localProfileDir: "/foo/bar"}},
      File: {
        exists: async () => true,
        read: sandbox.stub().resolves({}),
        writeAtomic: sinon.stub().returns(Promise.resolve()),
      },
      Path: {join: () => filename},
    };
    fakeTextDecoder = {decode: () => "{\"foo\": \"bar\"}"};
    reportErrorStub = sandbox.stub();
    globals.set("OS", fakeOS);
    globals.set("gTextDecoder", fakeTextDecoder);
    globals.set("Cu", {reportError: reportErrorStub});

    cache = new PersistentCache(filename);
  });
  afterEach(() => {
    globals.restore();
    sandbox.restore();
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
      await cache._load();
      fakeOS.File.read.resetHistory();
      await cache.get("foo");
      assert.notCalled(fakeOS.File.read);
    });
    it("should catch and report errors", async () => {
      fakeOS.File.read.throws();
      await cache._load();

      assert.calledOnce(reportErrorStub);
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
    it("tries to read the file on the first set", async () => {
      fakeOS.File.read = sinon.spy();
      await cache.set("foo", {x: 42});
      assert.calledOnce(fakeOS.File.read);
    });
    it("doesnt try to read the file if it was already loaded", async () => {
      fakeOS.File.read = sinon.spy();
      cache = new PersistentCache(filename, true);
      await cache._load();
      fakeOS.File.read.resetHistory();
      await cache.set("foo", {x: 42});
      assert.notCalled(fakeOS.File.read);
    });
    it("tries to read the file on the first set", async () => {
      fakeOS.File.read = sinon.spy();
      await cache.set("foo", {x: 42});
      assert.calledOnce(fakeOS.File.read);
    });
    it("sets a string value", async () => {
      const key = "testkey";
      const value = "testvalue";
      await cache.set(key, value);
      const cachedValue = await cache.get(key);
      assert.equal(cachedValue, value);
    });
    it("sets an object value", async () => {
      const key = "testkey";
      const value = {x: 1, y: 2, z: 3};
      await cache.set(key, value);
      const cachedValue = await cache.get(key);
      assert.deepEqual(cachedValue, value);
    });
    it("writes the data to file", async () => {
      const key = "testkey";
      const value = {x: 1, y: 2, z: 3};
      fakeOS.File.exists = async () => false;
      await cache.set(key, value);
      assert.calledOnce(fakeOS.File.writeAtomic);
      assert.calledWith(fakeOS.File.writeAtomic, filename, `{"testkey":{"x":1,"y":2,"z":3}}`, {tmpPath: `${filename}.tmp`});
    });
  });
});
