/* globals Services */
"use strict";

const {before, after} = require("sdk/test/utils");
const {SearchProvider, HIDDEN_ENGINES_PREF} = require("addon/SearchProvider");
const {Cu} = require("chrome");
const prefService = require("sdk/preferences/service");

Cu.import("resource://gre/modules/Services.jsm");

function hasProp(assert, obj) {
  return function(aProp) {
    assert.ok({}.hasOwnProperty.call(obj, aProp), `expect to have property ${aProp}`);
  };
}
let gSearchProvider;

exports.test_SearchProvider_state = function(assert) {
  // get inital state of search and check that it has the corret properties
  let state = gSearchProvider.currentState;
  let stateProps = hasProp(assert, state);
  ["engines", "currentEngine"].forEach(stateProps);

  // check that the engines are, in fact, iterable
  let {engines} = state;
  let proto = Object.getPrototypeOf(engines);
  let isIterable = Object.getOwnPropertySymbols(proto)[0] === Symbol.iterator;
  assert.ok(isIterable, "Engines are iterable");

  // check that the current engine is correct and has the correct properties
  let {currentEngine} = state;
  assert.equal(currentEngine.name, Services.search.currentEngine.name, "Current engine has been correctly set");
  let engineProps = hasProp(assert, currentEngine);
  ["name", "iconBuffer"].forEach(engineProps);
};

exports.test_SearchProvider_prefChange = function*(assert) {
  gSearchProvider.init();
  let promise = new Promise(resolve => {
    gSearchProvider.on("browser-search-engine-modified", (name, data) => {
      resolve([name, data]);
    });
  });
  prefService.set(HIDDEN_ENGINES_PREF, "Yahoo,Bing");
  const [name, data] = yield promise;
  assert.equal(name, "browser-search-engine-modified", "pref triggered the right event");
  assert.equal(data, "hiddenOneOffs", "event has the right data");
};

exports.test_SearchProvider_observe_current = function*(assert) {
  // test that the event emitter is working by setting a new current engine "TestSearch2"
  let engineName = "TestSearch2";
  gSearchProvider.init();
  // event emitter will fire when current engine is changed
  let promise = new Promise(resolve => {
    let handler = (name, data) => {
      if (data === "engine-current") {
        gSearchProvider.off("browser-search-engine-modified", handler);
        resolve([name, data]);
      }
    };
    gSearchProvider.on("browser-search-engine-modified", handler);
  });

  // set a new current engine
  Services.search.currentEngine = Services.search.getEngineByName(engineName);
  let expectedEventData = "engine-current";

  // emitter should fire and return the new engine
  let [eventName, actualEventData] = yield promise;
  assert.equal(eventName, "browser-search-engine-modified", `emitter sent the correct event ${eventName}`);
  assert.equal(expectedEventData, actualEventData, `emitter set the correct engine ${expectedEventData}`);
  gSearchProvider.uninit();
};

exports.test_SearchProvider_observe_change = function*(assert) {
  gSearchProvider.init();
  let promise = new Promise(resolve => {
    let handler = (name, data) => {
      if (data === "engine-changed") {
        gSearchProvider.off("browser-search-engine-modified", handler);
        resolve([name, data]);
      }
    };
    gSearchProvider.on("browser-search-engine-modified", handler);
  });
  // change the hidden status of the current engine
  Services.search.currentEngine.hidden = true;
  let expectedEventData = "engine-changed";

  // emitter should fire and return the new engine
  let [eventName, actualEventData] = yield promise;
  assert.equal(eventName, "browser-search-engine-modified", `emitter sent the correct event ${eventName}`);
  assert.equal(expectedEventData, actualEventData, `emitter set the correct engine ${expectedEventData}`);
  gSearchProvider.uninit();
};

before(exports, function*() {
  yield new Promise(resolve => {
    Services.search.init(resolve);
  });
  gSearchProvider = new SearchProvider();
  // create dummy test engines for testing
  Services.search.addEngineWithDetails("TestSearch1", "", "", "", "GET",
    "http://example.com/?q={searchTerms}");
  Services.search.addEngineWithDetails("TestSearch2", "", "", "", "GET",
    "http://example.com/?q={searchTerms}");
  // set one of the dummy test engines to the default engine
  Services.search.defaultEngine = Services.search.getEngineByName("TestSearch1");
});

after(exports, () => {
  Services.search.getEngines().forEach(engine => {
    Services.search.removeEngine(engine);
  });
});
require("sdk/test").run(exports);
