const {Page} = require("sdk/page-worker");
const {data} = require("sdk/self");
const {LOCAL_STORAGE_KEY} = require("common/constants");

class PageWorker {
  constructor({store}) {
    this._page = null;
    this._unsubscribe = null;
    this._store = store;
  }
  connect() {
    this._page = Page({
      contentURL: data.url("page-worker/page-worker.html"),
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start"
    });
    this._unsubscribe = this._store.subscribe(() => {
      this._page.port.emit("addon-to-content", {
        type: LOCAL_STORAGE_KEY,
        data: this._store.getState()
      });
    });
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
