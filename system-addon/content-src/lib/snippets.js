const DATABASE_NAME = "snippets_db";
const DATABASE_VERSION = 1;
const SNIPPETS_OBJECTSTORE_NAME = "snippets";
const SNIPPETS_UPDATE_INTERVAL_MS = 14400000; // 4 hours.

/**
 * SnippetsMap - A utility for cacheing values related to the snippet. It has
 *               the same interface as a Map, but is optionally backed by
 *               indexedDB for persistent storage.
 *               Call .connect() to open a database connection and restore any
 *               previously cached data, if necessary.
 *
 */
class SnippetsMap extends Map {
  constructor(...args) {
    super(...args);
    this._db = null;
  }

  set(key, value) {
    super.set(key, value);
    return this._dbTransaction(db => db.put(value, key));
  }

  delete(key, value) {
    super.delete(key);
    return this._dbTransaction(db => db.delete(key));
  }

  clear() {
    super.clear();
    return this._dbTransaction(db => db.clear());
  }

  /**
   * connect - Attaches an indexedDB back-end to the Map so that any set values
   *           are also cached in a store. It also restores any existing values
   *           that are already stored in the indexedDB store.
   *
   * @return {type}  description
   */
  async connect() {
    // Open the connection
    const db = await this._openDB();

    // Restore any existing values
    await this._restoreFromDb(db);

    // Attach a reference to the db
    this._db = db;
  }

  /**
   * _dbTransaction - Returns a db transaction wrapped with the given modifier
   *                  function as a Promise. If the db has not been connected,
   *                  it resolves immediately.
   *
   * @param  {func} modifier A function to call with the transaction
   * @return {obj}           A Promise that resolves when the transaction has
   *                         completed or errored
   */
  _dbTransaction(modifier) {
    if (!this._db) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const transaction = modifier(
        this._db
          .transaction(SNIPPETS_OBJECTSTORE_NAME, "readwrite")
          .objectStore(SNIPPETS_OBJECTSTORE_NAME)
      );
      transaction.onsuccess = event => resolve();

      /* istanbul ignore next */
      transaction.onerror = event => reject(transaction.error);
    });
  }

  _openDB() {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      /* istanbul ignore next */
      openRequest.onerror = event => {
        // Try to delete the old database so that we can start this process over
        // next time.
        indexedDB.deleteDatabase(DATABASE_NAME);
        reject(event);
      };

      openRequest.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(SNIPPETS_OBJECTSTORE_NAME)) {
          db.createObjectStore(SNIPPETS_OBJECTSTORE_NAME);
        }
      };

      openRequest.onsuccess = event => {
        let db = event.target.result;

        /* istanbul ignore next */
        db.onerror = err => console.error(err); // eslint-disable-line no-console
        /* istanbul ignore next */
        db.onversionchange = versionChangeEvent => versionChangeEvent.target.close();

        resolve(db);
      };
    });
  }

  _restoreFromDb(db) {
    return new Promise((resolve, reject) => {
      let cursorRequest;
      try {
        cursorRequest = db.transaction(SNIPPETS_OBJECTSTORE_NAME)
                          .objectStore(SNIPPETS_OBJECTSTORE_NAME).openCursor();
      } catch (err) {
        // istanbul ignore next
        reject(err);
        // istanbul ignore next
        return;
      }

      /* istanbul ignore next */
      cursorRequest.onerror = event => reject(event);

      cursorRequest.onsuccess = event => {
        let cursor = event.target.result;
        // Populate the cache from the persistent storage.
        if (cursor) {
          this.set(cursor.key, cursor.value);
          cursor.continue();
        } else {
          // We are done.
          resolve();
        }
      };
    });
  }
}

/**
 * SnippetsProvider - Initializes a SnippetsMap and loads snippets from a
 *                    remote location, or else default snippets if the remote
 *                    snippets cannot be retrieved.
 */
class SnippetsProvider {
  constructor() {
    // Initialize the Snippets Map and attaches it to a global so that
    // the snippet payload can interact with it.
    global.gSnippetsMap = new SnippetsMap();
  }

  get snippetsMap() {
    return global.gSnippetsMap;
  }

  async _refreshSnippets() {
    // Check if the cached version of of the snippets in snippetsMap. If it's too
    // old, blow away the entire snippetsMap.
    const cachedVersion = this.snippetsMap.get("snippets-cached-version");

    if (cachedVersion !== this.appData.version) {
      this.snippetsMap.clear();
    }

    // Has enough time passed for us to require an update?
    const lastUpdate = this.snippetsMap.get("snippets-last-update");
    const needsUpdate = !(lastUpdate >= 0) || Date.now() - lastUpdate > SNIPPETS_UPDATE_INTERVAL_MS;

    if (needsUpdate && this.appData.snippetsURL) {
      this.snippetsMap.set("snippets-last-update", Date.now());
      try {
        // TODO: timeout?
        const response = await fetch(this.appData.snippetsURL);
        if (response.status === 200) {
          const payload = await response.text();

          this.snippetsMap.set("snippets", payload);
          this.snippetsMap.set("snippets-cached-version", this.appData.version);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    }
  }

  _showDefaultSnippets() {
    // TODO
  }

  _showRemoteSnippets() {
    const snippetsEl = document.getElementById(this.elementId);
    const containerEl = document.getElementById(this.containerElementId);
    const payload = this.snippetsMap.get("snippets");

    if (!snippetsEl) {
      throw new Error(`No element was found with id '${this.elementId}'.`);
    }

    // This could happen if fetching failed
    if (!payload) {
      throw new Error("No remote snippets were found in gSnippetsMap.");
    }

    // Note that injecting snippets can throw if they're invalid XML.
    snippetsEl.innerHTML = payload;

    // Scripts injected by innerHTML are inactive, so we have to relocate them
    // through DOM manipulation to activate their contents.
    for (const scriptEl of snippetsEl.getElementsByTagName("script")) {
      const relocatedScript = document.createElement("script");
      relocatedScript.text = scriptEl.text;
      scriptEl.parentNode.replaceChild(relocatedScript, scriptEl);
    }

    // Unhide the container if everything went OK
    if (containerEl) {
      containerEl.style.display = "block";
    }
  }

  /**
   * init - Fetch the snippet payload and show snippets
   *
   * @param  {obj} options
   * @param  {str} options.appData.snippetsURL  The URL from which we fetch snippets
   * @param  {int} options.appData.version  The current snippets version
   * @param  {str} options.elementId  The id of the element in which to inject snippets
   * @param  {str} options.containerElementId  The id of the element of element containing the snippets element
   * @param  {bool} options.connect  Should gSnippetsMap connect to indexedDB?
   */
  async init(options) {
    Object.assign(this, {
      appData: {},
      elementId: "snippets",
      containerElementId: "snippets-container",
      connect: true
    }, options);

    // TODO: Requires enabling indexedDB on newtab
    // Restore the snippets map from indexedDB
    if (this.connect) {
      try {
        await this.snippetsMap.connect();
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    }

    // Cache app data values so they can be accessible from gSnippetsMap
    for (const key of Object.keys(this.appData)) {
      this.snippetsMap.set(`appData.${key}`, this.appData[key]);
    }

    // Refresh snippets, if enough time has passed.
    await this._refreshSnippets();

    // Try showing remote snippets, falling back to defaults if necessary.
    try {
      this._showRemoteSnippets();
    } catch (e) {
      this._showDefaultSnippets(e);
    }
  }
}

module.exports.SnippetsMap = SnippetsMap;
module.exports.SnippetsProvider = SnippetsProvider;
module.exports.SNIPPETS_UPDATE_INTERVAL_MS = SNIPPETS_UPDATE_INTERVAL_MS;
