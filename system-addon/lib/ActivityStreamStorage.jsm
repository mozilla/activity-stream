ChromeUtils.defineModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.ActivityStreamStorage = class ActivityStreamStorage {
  /**
   * @param storeName String with the store name to access or array of strings
   *                  to create all the required stores
   */
  constructor(storeName) {
    this.dbName = "ActivityStream";
    this.dbVersion = 2;
    this.storeName = storeName;

    this._db = null;
  }

  get db() {
    if (!this._db) {
      throw new Error("It looks like the db connection has not initialized yet. Are you use .init was called?");
    }
    return this._db;
  }

  get intialized() {
    return this._db !== null;
  }

  getStore() {
    return this.db.objectStore(this.storeName, "readwrite");
  }

  get(key) {
    return this.getStore().get(key);
  }

  getAll() {
    return this.getStore().getAll();
  }

  set(key, value) {
    return this.getStore().put(value, key);
  }

  _openDatabase() {
    return IndexedDB.open(this.dbName, {version: this.dbVersion}, db => {
      // If provided with array of objectStore names we need to create all the
      // individual stores
      if (Array.isArray(this.storeName)) {
        this.storeName.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        });
      } else if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName);
      }
    });
  }

  async init() {
    this._db = await this._openDatabase();
  }
};

function getDefaultOptions(options) {
  return {collapsed: !!options.collapsed};
}

const EXPORTED_SYMBOLS = ["ActivityStreamStorage", "getDefaultOptions"];
