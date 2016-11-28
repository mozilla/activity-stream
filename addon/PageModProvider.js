const generateUUID = require("sdk/util/uuid");
const privateBrowsing = require("sdk/private-browsing");
const {Cu} = require("chrome");
const {PageMod} = require("sdk/page-mod");
const {data} = require("sdk/self");
const {CONTENT_TO_ADDON} = require("common/event-constants");
const {WORKER_ATTACHED_EVENT} = require("common/constants");

module.exports = class PageModProvider {
  constructor({pageURL, uuid, onAddWorker, onRemoveWorker} = {}) {
    this.workers = new Map();
    this.pageURL = pageURL;
    this.uuid = uuid || (() => String(generateUUID.uuid()));
    this.onAddWorker = onAddWorker;
    this.onRemoveWorker = onRemoveWorker;
    this._perfMeter = null;
    this._pagemod = null;
    this._logEvent = null;
  }

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  init({onAttach, onMessage, logEvent} = {}) {
    this._logEvent = logEvent;
    this._pagemod = new PageMod({
      include: [`${this.pageURL}*`],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start",
      attachTo: ["existing", "top"],
      onAttach: worker => {
        if (onAttach) {
          onAttach();
        }

        // Don't attach when in private browsing. Send user to about:privatebrowsing
        if (privateBrowsing.isPrivate(worker)) {
          worker.tab.url = "about:privatebrowsing";
          return;
        }

        // This detaches workers on reload or closing the tab
        worker.on("detach", () => this.removeWorker(worker));

        // add the worker to a set to enable broadcasting
        const workerId = this.addWorker(worker);

        worker.port.on(CONTENT_TO_ADDON, msg => {
          if (!msg.type) {
            Cu.reportError("ActivityStreams.dispatch error: unknown message type");
            return;
          }
          // This detaches workers if a new url is launched
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            this.removeWorker(worker);
          }
          if (onMessage) {
            const message = Object.assign({}, msg, {workerId});
            onMessage({msg: message, worker});
          }
        });
      },
      onError: err => {
        Cu.reportError(err);
      }
    });
  }

  /**
   * getWorkerById - Returns a reference to a worker, given an id
   *
   * @param  {string} workerId unique identified of a worker
   * @return {obj}             a worker
   */
  getWorkerById(workerId) {
    let worker;
    for (let [w, id] of this.workers) {
      if (id === workerId) {
        worker = w;
      }
    }
    return worker;
  }

  /**
   * Adds a worker and returns the new id
   */
  addWorker(worker) {
    if (this.workers.has(worker)) {
      return this.workers.get(worker);
    }
    const id = this.uuid();
    this.workers.set(worker, id);
    if (this._logEvent) {
      this._logEvent(worker.tab, WORKER_ATTACHED_EVENT);
    }
    if (this.onAddWorker) {
      this.onAddWorker();
    }
    return id;
  }

  /**
   * Removes a worker
   */
  removeWorker(worker) {
    this.workers.delete(worker);
    if (this.onRemoveWorker) {
      this.onRemoveWorker();
    }
  }

  destroy() {
    this.workers.clear();
    if (this._pagemod) {
      this._pagemod.destroy();
    }
  }
};
