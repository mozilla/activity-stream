const {Page} = require("sdk/page-worker");
const {data} = require("sdk/self");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {ADDON_TO_CONTENT} = require("common/event-constants");

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
    // Note: According to the redux docs, calling .subscribe on a store
    // returns a function which will unsubscribe
    this._unsubscribe = this._store.subscribe(this._onDispatch);
  }
  destroy() {
    if (this._page) {
      this._page.destroy();
      this._page = null;
    }
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }
}

module.exports = PageWorker;
