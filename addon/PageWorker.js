const {Page} = require("sdk/page-worker");
const {data} = require("sdk/self");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {ADDON_TO_CONTENT} = require("common/event-constants");
const watch = require("redux-watch");
const debounce = require("lodash.debounce");

class PageWorker {
  constructor({store, wait} = {}) {
    if (!store) {
      throw new Error("options.store is required");
    }
    this._page = null;
    this._onDispatch = this._onDispatch.bind(this);
    this._unsubscribe = null;
    this._store = store;
    this._wait = wait || 100;
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

    /* Notes:
    1. According to the redux docs, calling .subscribe on a store
    returns a function which will unsubscribe
    2. We wait a certain amount of time (this._wait) before updating
    local storage in order to not overload writing to the state. In order for
    user actions to accurately represent the state of the app when we trigger a
    refresh (or open a new tab) we must set the wait to be low i.e 100ms in this case */

    this._unsubscribe = this._store.subscribe(debounce(w(this._onDispatch), this._wait));
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
