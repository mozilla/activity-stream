ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/Console.jsm");

ChromeUtils.defineModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.ActivityStreamStorage = class ActivityStreamStorage {
  constructor(storeName) {
    this.dbName = "ActivityStream";
    this.dbVersion = 2;
    this.storeName = storeName;
    this.keyPath = "id";

    this.initialized = false;
    this._db = null;
  }

  get db() {
    if (!this._db) {
      throw new Error("It looks like the db connection has not initialized yet. Are you use .init was called?");
    }
    return this._db;
  }

  getStore() {
    return this.db.objectStore(this.storeName, "readwrite");
  }

  get() {
    return this.getStore().getAll();
  }

  set(obj) {
    return this.getStore().put(obj);
  }

  _openDatabase() {
    return IndexedDB.open(this.dbName, {version: this.dbVersion, storage: "persistent"}, db => {
      db.createObjectStore(this.storeName, {keyPath: this.keyPath});
    });
  }

  async init() {
    this._db = await this._openDatabase();
    this.initialized = true;
  }
};

const EXPORTED_SYMBOLS = ["ActivityStreamStorage"];
