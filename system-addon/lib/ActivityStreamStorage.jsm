ChromeUtils.defineModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.ActivityStreamStorage = class ActivityStreamStorage {
  /**
   * @param storeName String with the store name to access or array of strings
   *                  to create all the required stores
   */
  constructor(storeNames, telemetry) {
    this.dbName = "ActivityStream";
    this.dbVersion = 3;
    this.storeNames = storeNames;
    this.telemetry = telemetry;
  }

  get db() {
    return this._db || (this._db = this._openDatabase());
  }

  async getStore(storeName) {
    return (await this.db).objectStore(storeName, "readwrite");
  }

  get(storeName, key) {
    return this.requestWrapper(async () => (await this.getStore(storeName)).get(key));
  }

  getAll(storeName) {
    return this.requestWrapper(async () => (await this.getStore(storeName)).getAll());
  }

  set(storeName, key, value) {
    return this.requestWrapper(async () => (await this.getStore(storeName)).put(value, key));
  }

  _openDatabase() {
    return IndexedDB.open(this.dbName, {version: this.dbVersion}, db => {
      // If provided with array of objectStore names we need to create all the
      // individual stores
      this.storeNames.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          this.requestWrapper(() => db.createObjectStore(store));
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

  async requestWrapper(request) {
    let result = null;
    try {
      result = await request();
    } catch (e) {
      if (this.telemetry) {
        this.telemetry.handleUndesiredEvent({data: {event: "TRANSACTION_FAILED"}});
      }
      Cu.reportError(e.stack);
    }

    return result;
  }
};

function getDefaultOptions(options) {
  return {collapsed: !!options.collapsed};
}

const EXPORTED_SYMBOLS = ["ActivityStreamStorage", "getDefaultOptions"];
