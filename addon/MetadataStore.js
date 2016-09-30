 /* globals XPCOMUtils, Task, OS, Sqlite, PlacesUtils, NetUtil, Services */
"use strict";

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Sqlite.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

const {MIGRATIONS} = require("addon/MetadataStoreMigration.js");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS",
                                  "resource://gre/modules/osfile.jsm");

const METASTORE_NAME = "metadata.sqlite";

const SQL_DDLS = [
  `CREATE TABLE IF NOT EXISTS page_metadata (
      id INTEGER PRIMARY KEY,
      cache_key LONGVARCHAR UNIQUE,
      places_url LONGVARCHAR,
      title TEXT,
      type VARCHAR(32),
      description TEXT,
      media_url LONGVARCHAR,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expired_at LONG
  )`,
  `CREATE TABLE IF NOT EXISTS page_images (
    id INTEGER PRIMARY KEY,
    url LONGVARCHAR UNIQUE,
    type INTEGER,
    height INTEGER,
    width INTEGER,
    color VARCHAR(32)
  )`,
  `CREATE TABLE IF NOT EXISTS page_metadata_images (
    metadata_id INTEGER,
    image_id INTEGER,
    FOREIGN KEY(metadata_id) REFERENCES page_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(image_id) REFERENCES page_images(id) ON DELETE CASCADE
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS page_metadata_cache_key_uniqueindex ON page_metadata (cache_key)",
  "CREATE UNIQUE INDEX IF NOT EXISTS page_images_url_uniqueindex ON page_images (url)",
  `CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    version VARCHAR(32)
  )`
];

const SQL_LAST_INSERT_ROWID = "SELECT last_insert_rowid() AS lastInsertRowID";

const SQL_INSERT_METADATA = `INSERT INTO page_metadata
  (cache_key, places_url, title, type, description, media_url, expired_at, metadata_source)
  VALUES
  (:cache_key, :places_url, :title, :type, :description, :media_url, :expired_at, :metadata_source)`;

const SQL_INSERT_IMAGES = `INSERT INTO page_images
  (url, type, height, width, color)
  VALUES
  (:url, :type, :height, :width, :color)`;

const SQL_INSERT_METADATA_IMAGES = `INSERT INTO page_metadata_images
  (metadata_id, image_id) VALUES (?, ?)`;

const SQL_SELECT_IMAGE_ID = "SELECT id FROM page_images WHERE url = ?";

const SQL_DROPS = [
  "DROP TABLE IF EXISTS page_metadata_images",
  "DROP TABLE IF EXISTS page_metadata",
  "DROP TABLE IF EXISTS page_images",
  "DROP TABLE IF EXISTS migrations"
];

const SQL_DELETE_EXPIRED = "DELETE FROM page_metadata WHERE expired_at <= (CAST(strftime('%s', 'now') AS LONG)*1000)";

/* Image type constants */
const IMAGE_TYPES = {
  "favicon": 1,
  "favicon_rich": 2,
  "preview": 3
};

function MetadataStore(path, migrations = null) {
  this._path = path || OS.Path.join(OS.Constants.Path.profileDir, METASTORE_NAME);
  this._migrations = migrations || MIGRATIONS;
  this._conn = null;
  this._dataExpiryJob = null;
}

MetadataStore.prototype = {
  /**
   * Creates the table schema for the metadata database. This function must be called
   * after a database connection has been established
   */
  _asyncCreateTableSchema: Task.async(function*() {
    try {
      yield this._conn.executeTransaction(function*() {
        for (let ddl of SQL_DDLS) {
          yield this._conn.execute(ddl);
        }

        // Handle the migrations
        const currentVersion = yield this._asyncGetCurrentVersion();
        let lastVersion = currentVersion.version;
        for (let i = currentVersion.index + 1; i < this._migrations.length; i++) {
          const migration = this._migrations[i];
          lastVersion = migration.version;
          for (let statement of migration.statements) {
            yield this._conn.execute(statement);
          }
        }
        if (lastVersion !== currentVersion.version) {
          this._conn.execute("INSERT OR REPLACE INTO migrations (id, version) VALUES (1, ?)", [lastVersion]);
        }
      }.bind(this));
    } catch (e) {
      Cu.reportError("MetadataStore failed to create tables.");
      throw e;
    }
  }),

  _asyncGetCurrentVersion: Task.async(function*() {
    const result = yield this._conn.execute("SELECT version FROM migrations");
    let currentVersion;
    try {
      currentVersion = result[0].getResultByName("version");
    } catch (e) {
      currentVersion = "1.0.0"; // for the first run
    }
    for (let i = this._migrations.length - 1; i >= 0; i--) {
      if (this._migrations[i].version === currentVersion) {
        return {version: currentVersion, index: i};
      }
    }
    throw new Error(`Can't find version ${currentVersion} in the migration history`);
  }),

  get transactionInProgress() {
    if (!this._conn) {
      return false;
    }
    return this._conn.transactionInProgress;
  },

  /**
   * Creates a connection to the metadata database. It sets the journal mode
   * to WAL, enables the foreign key support, and also creates the tables and
   * indices if necessary
   *
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncConnect: Task.async(function*() {
    if (this._conn) {
      return;
    }

    try {
      this._conn = yield Sqlite.openConnection({path: this._path});
      yield this._conn.execute("PRAGMA journal_mode = WAL;");
      yield this._conn.execute("PRAGMA foreign_keys = ON;");
      yield this._asyncCreateTableSchema();
    } catch (e) {
      Cu.reportError(`MetadataStore failed to create connection: ${e.message}`);
      throw e;
    }
  }),

  asyncClose: Task.async(function*() {
    if (this._conn) {
      yield this._conn.close();
      this._conn = null;
    }
  }),

  _getMetadataParameters(aRow) {
    return {
      cache_key: aRow.cache_key,
      places_url: aRow.places_url,
      title: aRow.title,
      type: aRow.type,
      description: aRow.description,
      media_url: aRow.media && aRow.media.url,
      expired_at: aRow.expired_at,
      metadata_source: aRow.metadata_source || "Embedly"
    };
  },

  _getFaviconParameters(aRow) {
    return {
      url: aRow.favicon_url,
      type: IMAGE_TYPES.favicon,
      height: 0,
      width: 0,
      color: (aRow.favicon_colors && aRow.favicon_colors[0]) ? this._rgbToHex(aRow.favicon_colors[0].color) : null
    };
  },

  _getImageParameters(aRow) {
    return {
      url: aRow.url,
      type: IMAGE_TYPES.preview,
      height: aRow.height,
      width: aRow.width,
      color: (aRow.colors && aRow.colors[0]) ? this._rgbToHex(aRow.colors[0].color) : null
    };
  },

  /**
  * Convert a RGB array to the Hex form, e.g. [10, 1, 2] => #0A0102
  */
  _rgbToHex(rgb) {
    return rgb ? `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1).toUpperCase()}` : null;
  },

  /**
  * Convert a hex color string to the RGB form, e.g. #0A0102 => [10, 1, 2]
  */
  _hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  },

  _asyncGetLastInsertRowID: Task.async(function*() {
    let result = yield this._conn.execute(SQL_LAST_INSERT_ROWID);
    return result[0].getResultByName("lastInsertRowID");
  }),

  _asyncGetImageIDByURL: Task.async(function*(url) {
    let result = yield this._conn.executeCached(SQL_SELECT_IMAGE_ID, [url]);
    return result[0].getResultByName("id");
  }),

  /**
   * Inserts the metadata into the database. It consists of two tables,
   * i.e. page_metadata for the regular meta information of the page, and
   * page_images for the favicon and preview images.
   *
   * metaObjects, an array of metadata objects that currently generated by embed.ly
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncInsert: Task.async(function*(metaObjects) {
    if (!this._conn) {
      throw new Error("MetadataStore is not yet connected");
    }

    const principal = Services.scriptSecurityManager.getSystemPrincipal();
    for (let metaObject of metaObjects) {
      yield this._conn.executeTransaction(function*() {
        let metadata_id;
        let image_ids = [];

        if (!metaObject.places_url) {
          throw new Error("Objects to insert must include a places_url");
        }

        if (metaObject.favicon_url) {
          // attach favicon to places_url for Places
          PlacesUtils.favicons.setAndFetchFaviconForPage(
            NetUtil.newURI(metaObject.places_url),
            NetUtil.newURI(metaObject.favicon_url),
            false,
            PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE,
            null,
            principal
          );
        }

        /* 1. inserts it into page_metadata */
        try {
          let metadataBindings = this._getMetadataParameters(metaObject);
          yield this._conn.executeCached(SQL_INSERT_METADATA, metadataBindings);
          metadata_id = yield this._asyncGetLastInsertRowID();
        } catch (e) {
          Cu.reportError(`MetadataStore failed to insert metadata: ${e.message}`);
          throw e;
        }

        /* 2. inserts the favicon into page_images, handles the special case, in which
         * the favicon already exsits */
        if (metaObject.favicon_url) {
          let faviconBindings = this._getFaviconParameters(metaObject);
          try {
            yield this._conn.executeCached(SQL_INSERT_IMAGES, faviconBindings);
            image_ids.push(yield this._asyncGetLastInsertRowID());
          } catch (e) {
            try {
              image_ids.push(yield this._asyncGetImageIDByURL(faviconBindings.url));
            } catch (ex) {
              Cu.reportError(`MetadataStore failed to insert favicon: ${ex.message}`);
              throw ex; /* force this transaction to rollback */
            }
          }
        }

        /* 3. inserts all the preview images, if they exist */
        if (metaObject.images) {
          for (let image of metaObject.images) {
            let imageBindings = this._getImageParameters(image);
            try {
              yield this._conn.executeCached(SQL_INSERT_IMAGES, imageBindings);
              image_ids.push(yield this._asyncGetLastInsertRowID());
            } catch (e) {
              try {
                image_ids.push(yield this._asyncGetImageIDByURL(imageBindings.url));
              } catch (ex) {
                Cu.reportError(`MetadataStore failed to fetch the id of image: ${ex.message}`);
                throw ex; /* force this transaction to rollback */
              }
            }
          }

          /* 4. inserts relations into the page_metadata_images */
          for (let image_id of image_ids) {
            yield this._conn.executeCached(SQL_INSERT_METADATA_IMAGES, [metadata_id, image_id]);
          }
        }
      }.bind(this));
    }
  }),

  /**
   * Drops all the tables and the corresponding indices, the table schema remains
   *
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncReset: Task.async(function*() {
    if (this._conn) {
      try {
        yield this._conn.executeTransaction(function*() {
          for (let drop of SQL_DROPS) {
            yield this._conn.execute(drop);
          }
        }.bind(this));
        yield this._asyncCreateTableSchema();
      } catch (e) {
        Cu.reportError(`MetadataStore failed to drop: ${e.message}`);
        throw e;
      }
    }
  }),

  /**
   * Delete the metadata store SQLite file, it'll automatically close the
   * database connection
   */
  asyncTearDown: Task.async(function*() {
    try {
      yield this.asyncClose();
      yield OS.File.remove(this._path, {ignoreAbsent: true});
    } catch (e) {
      Cu.reportError(`MetadataStore failed to tear down the database: ${e.message}`);
    }
  }),

  /**
   * Executes arbitrary query against metadata database. For bulk insert, use
   * asyncInsert function instead
   *
   * @param {String} aSql
   *        SQL query to execute
   * @param {Object} [optional] aOptions
   *        aOptions.columns - an array of column names. if supplied the return
   *        items will consists of objects keyed on column names. Otherwise
   *        array of raw values is returned in the select order
   *        aOptions.param - an object of SQL binding parameters
   *        aOptions.callback - a callback to handle query raws
   *
   * Returns a promise with the array of retrieved items
   */
  asyncExecuteQuery: Task.async(function*(aSql, aOptions = {}) {
    let {columns, params, callback} = aOptions;
    let items = [];
    let queryError = null;

    if (!this._conn) {
      throw new Error("MetadataStore is not yet connected");
    }

    yield this._conn.executeCached(aSql, params, aRow => {
      try {
        // check if caller wants to handle query raws
        if (callback) {
          callback(aRow);
        }
        // otherwise fill in the item and add items array
        else {
          let item = null;
          // if columns array is given construct an object
          if (columns && Array.isArray(columns)) {
            item = {};
            columns.forEach(column => {
              item[column] = aRow.getResultByName(column);
            });
          } else {
            // if no columns - make an array of raw values
            item = [];
            for (let i = 0; i < aRow.numEntries; i++) {
              item.push(aRow.getResultByIndex(i));
            }
          }
          items.push(item);
        }
      } catch (e) {
        queryError = e;
        throw StopIteration;
      }
    });
    if (queryError) {
      throw new Error(queryError);
    }
    return items;
  }),

  /**
   * Get page metadata (including images) for the given cache_keys.
   * For the missing cache_keys, it simply ignores them and will not
   * raise any exception. Note that if this function gets called on
   * a closed or unestablished connection, it returns an empty array
   *
   * @param {Array} cacheKeys an cache key array
   *
   * Returns a promise with the array of retrieved metadata records
   */
  asyncGetMetadataByCacheKey: Task.async(function*(cacheKeys) {
    const quoted = cacheKeys.map(key => `'${key}'`).join(",");
    let metaObjects;
    try {
      metaObjects = yield this.asyncExecuteQuery(
        `SELECT * FROM page_metadata WHERE cache_key IN (${quoted})`,
        {columns: ["id", "cache_key", "places_url", "title", "type", "description", "media_url"]}
      );
    }
    catch (e) {
      // return immediately if there is any exception gets thrown
      return [];
    }

    // fetch the favicons and images for each metadata object
    for (let metaObject of metaObjects) {
      let images;
      metaObject.images = [];
      metaObject.favicons = [];

      try {
        images = yield this.asyncExecuteQuery(
          `SELECT pi.*
           FROM page_metadata AS pm
              JOIN page_metadata_images AS pmi ON pm.id = pmi.metadata_id
              JOIN page_images AS pi ON pi.id = pmi.image_id
           WHERE pm.id = ${metaObject.id}`,
           {columns: ["url", "type", "height", "width", "color"]}
        );
      } catch (e) {
        // return immediately if there is any exception gets thrown, we do not
        // want to return the partially fetched metadata entries
        return [];
      }
      for (let image of images) {
        switch (image.type) {
          case IMAGE_TYPES.favicon:
          case IMAGE_TYPES.favicon_rich:
            metaObject.favicons.push({
              url: image.url,
              color: this._hexToRgb(image.color)
            });
            break;
          case IMAGE_TYPES.preview:
            metaObject.images.push({
              url: image.url,
              color: this._hexToRgb(image.color),
              height: image.height,
              width: image.width
            });
            break;
          default:
            throw new Error("Fetched unknown image types: {image.type}");
        }
      }
    }

    return metaObjects;
  }),

  /**
   * Check if the link exists in the database by checking if it's cache key exists
   *
   * @param {String} key a cache key
   *
   * Returns a promise with the array of the retrieved metadata record
   */
  asyncCacheKeyExists: Task.async(function*(key) {
    try {
      let metadataLink = yield this.asyncExecuteQuery(`SELECT 1 FROM page_metadata WHERE cache_key = '${key}'`);
      return metadataLink.length > 0;
    } catch (e) {
      return false;
    }
  }),

  /**
  * Enables the data expiry job. The database connection needs to
  * be established prior to calling this function. Once it's triggered,
  * any following calls will be ignored unless the user disables
  * it by disableDataExpiryJob()
  *
  * @param {Number} interval
  *        an time interval in millisecond for this cron job
  */
  enableDataExpiryJob(interval) {
    if (this._dataExpiryJob) {
      return;
    }

    this._dataExpiryJob = setInterval(() => {
      if (!this._conn) {
        return;  // ignore the callback if the connection is invalid
      }

      this._conn.execute(SQL_DELETE_EXPIRED).catch(error => {
        // The delete might fail if a table dropping is being processed at
        // the same time
        Cu.reportError(`Failed to delete expired metadata: ${error.message}`);
      });
    }, interval);
  },

  disableDataExpiryJob() {
    if (this._dataExpiryJob) {
      clearInterval(this._dataExpiryJob);
      this._dataExpiryJob = null;
    }
  }
};

exports.MetadataStore = MetadataStore;
exports.METASTORE_NAME = METASTORE_NAME;
