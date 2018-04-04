ChromeUtils.defineModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.ActivityStreamStorage = class ActivityStreamStorage {
  /**
   * @param storeName String with the store name to access or array of strings
   *                  to create all the required stores
   */
  constructor(storeNames) {
    this.dbName = "ActivityStream";
    this.dbVersion = 3;
    this.storeNames = storeNames;
  }

  get db() {
    return this._db || (this._db = this._openDatabase());
  }

  async getStore(storeName) {
    return (await this.db).objectStore(storeName, "readwrite");
  }

  async get(storeName, key) {
    return (await this.getStore(storeName)).get(key);
  }

  async getAll(storeName) {
    return (await this.getStore(storeName)).getAll();
  }

  async set(storeName, key, value) {
    return (await this.getStore(storeName)).put(value, key);
  }

  _openDatabase() {
    return IndexedDB.open(this.dbName, {version: this.dbVersion}, db => {
      // If provided with array of objectStore names we need to create all the
      // individual stores
      this.storeNames.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    });
  }

  getObjectStore(storeName) {
    if (this.storeNames.includes(storeName)) {
      return {
        get: this.get.bind(this, storeName),
        getAll: this.getAll.bind(this, storeName),
        set: this.set.bind(this, storeName)
      };
    }

    return null;
  }
};

function getDefaultOptions(options) {
  return {collapsed: !!options.collapsed};
}

const EXPORTED_SYMBOLS = ["ActivityStreamStorage", "getDefaultOptions"];
