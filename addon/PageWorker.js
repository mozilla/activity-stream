const {Page} = require("sdk/page-worker");
const {data} = require("sdk/self");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {ADDON_TO_CONTENT} = require("common/event-constants");
const watch = require("common/vendor")("redux-watch");

class PageWorker {
  constructor({store} = {}) {
    if (!store) {
      throw new Error("options.store is required");
    }
    this._page = null;
    this._onDispatch = this._onDispatch.bind(this);
    this._unsubscribe = null;
    this._store = store;
  }
  _onDispatch() {
    this._page.port.emit(ADDON_TO_CONTENT, {
      type: LOCAL_STORAGE_KEY,
      data: this._store.getState()
    });
  }
  connect() {
    this._page = Page({
      contentURL: data.url("page-worker/page-worker.html"),
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start"
    });

    // Note: watch only calls the callback (this._onDispatch) if something on
    // the state object actually changed
    const w = watch(this._store.getState);
    // Note: According to the redux docs, calling .subscribe on a store
    // returns a function which will unsubscribe
    this._unsubscribe = this._store.subscribe(w(this._onDispatch));
  }
  destroy() {
    if (this._page) {
      try {
        this._page.destroy();
      } catch (e) {
        // The page probably wasn't set up yet
      }
      this._page = null;
    }
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }
}

module.exports = PageWorker;
