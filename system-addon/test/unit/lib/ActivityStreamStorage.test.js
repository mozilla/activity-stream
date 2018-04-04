import {ActivityStreamStorage} from "lib/ActivityStreamStorage.jsm";
import {GlobalOverrider} from "test/unit/utils";

let overrider = new GlobalOverrider();

describe("ActivityStreamStorage", () => {
  let sandbox;
  let indexedDB;
  let storage;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    indexedDB = {open: sandbox.stub().resolves({})};
    overrider.set({IndexedDB: indexedDB});
    storage = new ActivityStreamStorage(["storage_test"]);
  });
  afterEach(() => {
    sandbox.restore();
  });
  it("should not throw an error when accessing db", async () => {
    assert.ok(storage.db);
  });
  describe("#getObjectStore", () => {
    let testStorage;
    let storeStub;
    beforeEach(() => {
      storeStub = {
        getAll: sandbox.stub().resolves(),
        get: sandbox.stub().resolves(),
        put: sandbox.stub().resolves()
      };
      sandbox.stub(storage, "getStore").resolves(storeStub);
      testStorage = storage.getObjectStore("storage_test");
    });
    it("should reverse key value parameters for put", async () => {
      await testStorage.set("key", "value");

      assert.calledOnce(storeStub.put);
      assert.calledWith(storeStub.put, "value", "key");
    });
    it("should return the correct value for get", async () => {
      storeStub.get.withArgs("foo").resolves("foo");

      const result = await testStorage.get("foo");

      assert.calledOnce(storeStub.get);
      assert.equal(result, "foo");
    });
    it("should return the correct value for getAll", async () => {
      storeStub.getAll.resolves(["bar"]);

      const result = await testStorage.getAll();

      assert.calledOnce(storeStub.getAll);
      assert.deepEqual(result, ["bar"]);
    });
    it("should query the correct object store", async () => {
      await testStorage.get();

      assert.calledOnce(storage.getStore);
      assert.calledWithExactly(storage.getStore, "storage_test");
    });
    it("should return null for object stores that don't exist", () => {
      assert.isNull(storage.getObjectStore("undefined_store"));
    });
  });
  it("should get the correct objectStore when calling getStore", async () => {
    const objectStoreStub = sandbox.stub();
    indexedDB.open.resolves({objectStore: objectStoreStub});

    await storage.getStore("foo");

    assert.calledOnce(objectStoreStub);
    assert.calledWithExactly(objectStoreStub, "foo", "readwrite");
  });
  it("should create a db with the correct store name", async () => {
    const dbStub = {createObjectStore: sandbox.stub(), objectStoreNames: {contains: sandbox.stub().returns(false)}};
    await storage.db;

    // call the cb with a stub
    indexedDB.open.args[0][2](dbStub);

    assert.calledOnce(dbStub.createObjectStore);
    assert.calledWithExactly(dbStub.createObjectStore, "storage_test");
  });
  it("should handle an array of object store names", async () => {
    storage = new ActivityStreamStorage(["store1", "store2"]);
    const dbStub = {createObjectStore: sandbox.stub(), objectStoreNames: {contains: sandbox.stub().returns(false)}};
    await storage.db;

    // call the cb with a stub
    indexedDB.open.args[0][2](dbStub);

    assert.calledTwice(dbStub.createObjectStore);
    assert.calledWith(dbStub.createObjectStore, "store1");
    assert.calledWith(dbStub.createObjectStore, "store2");
  });
  it("should skip creating existing stores", async () => {
    storage = new ActivityStreamStorage(["store1", "store2"]);
    const dbStub = {createObjectStore: sandbox.stub(), objectStoreNames: {contains: sandbox.stub().returns(true)}};
    await storage.db;

    // call the cb with a stub
    indexedDB.open.args[0][2](dbStub);

    assert.notCalled(dbStub.createObjectStore);
  });
  describe("#requestWrapper", () => {
    beforeEach(async () => {
      storage.telemetry = {handleUndesiredEvent: sandbox.stub()};
    });
    it("should return a successful result", async () => {
      const result = await storage.requestWrapper(() => Promise.resolve("foo"));

      assert.equal(result, "foo");
      assert.notCalled(storage.telemetry.handleUndesiredEvent);
    });
    it("should report failures", async () => {
      const result = await storage.requestWrapper(() => Promise.reject(new Error()));

      assert.isNull(result);
      assert.calledOnce(storage.telemetry.handleUndesiredEvent);
    });
  });
});
