"use strict";

const {Cc, Ci, Cu, components} = require("chrome");
const {TelemetrySender} = require("addon/TelemetrySender");
const {TabTracker} = require("addon/TabTracker");
const {ActivityStreams} = require("addon/ActivityStreams");
const {stack: Cs} = components;

// If we didn't get passed a stack, maybe the error has one otherwise get it
// from our call context
function doThrow(error, stack = error.stack || Cs.caller) {
  let filename = "";
  if (stack instanceof Ci.nsIStackFrame) {
    filename = stack.filename;
  } else if (error.fileName) {
    filename = error.fileName;
  }

  throw (new Error(`Error at ${filename}`));
}

function doGetFile(path, allowNonexistent) {
  try {
    let lf = Cc["@mozilla.org/file/directory_service;1"]
      .getService(Ci.nsIProperties)
      .get("CurWorkD", Ci.nsILocalFile);

    let bits = path.split("/");
    for (let bit of bits.filter(b => b)) {
      if (bit !== "..") {
        lf.append(bit);
      } else {
        lf = lf.parent;
      }
    }

    if (!allowNonexistent && !lf.exists()) {
      // Not using do_throw(): caller will continue.
      let stack = Cs.caller;
      Cu.reportError(`[${stack.name} : ${stack.lineNumber}] ${lf.path} does not exist`);
    }

    return lf;
  } catch (ex) {
    doThrow(ex.toString(), Cs.caller);
  }

  return null;
}

function doDump(object, trailer) {
  dump(JSON.stringify(object, null, 1) + trailer); // eslint-disable-line no-undef
}

function getTestSearchProvider() {
  return {
    init() {},
    uninit() {},
    on() {},
    off() {},
    get currentState() {
      return {
        engines: [],
        currentEngine: this.currentEngine
      };
    },
    get searchSuggestionUIStrings() {
      return {
        "searchHeader": "%S Search",
        "searchForSomethingWith": "Search for",
        "searchSettings": "Change Search Settings",
        "searchPlaceholder": "Search the Web"
      };
    },
    get currentEngine() {
      return {
        name: "",
        iconBuffer: []
      };
    },
    QueryInterface: {}
  };
}

function getTestActivityStream(options = {}) {
  const mockMetadataStore = {
    asyncConnect() { return Promise.resolve(); },
    asyncReset() { return Promise.resolve(); },
    asyncClose() { return Promise.resolve(); },
    asyncInsert() { return Promise.resolve(); },
    asyncGetMetadataByCacheKey() { return Promise.resolve([]); },
    asyncGetOldestInsert() { return Promise.resolve([0]); },
    asyncCountAllItems() { return Promise.resolve([0]); }
  };
  const mockPageScraper = {
    options: {framescriptPath: ""},
    init() {},
    uninit() {},
    _parseAndSave() {},
    asyncFetchLinks() {}
  };

  const mockPageWorker = {
    connect() {},
    destroy() {}
  };

  options.pageScraper = mockPageScraper;
  options.pageWorker = mockPageWorker;
  options.searchProvider = getTestSearchProvider();
  const testTabTracker = new TabTracker(options);
  const testTelemetrySender = new TelemetrySender();
  let mockApp = new ActivityStreams(mockMetadataStore, testTabTracker, testTelemetrySender, options);
  mockApp.init();
  return mockApp;
}

exports.doGetFile = doGetFile;
exports.doThrow = doThrow;
exports.doDump = doDump;
exports.getTestActivityStream = getTestActivityStream;
