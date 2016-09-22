/* globals Services */
"use strict";

const {before, after} = require("sdk/test/utils");
const {SearchProvider} = require("addon/SearchProvider");
const {Cu} = require("chrome");

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

exports.test_SearchProvider_observe = function*(assert) {
  // test that the event emitter is working by setting a new current engine "TestSearch2"
  let engineName = "TestSearch2";
  gSearchProvider.init();
  // event emitter will fire when current engine is changed
  let promise = new Promise(resolve => {
    let handler = (name, data) => {
      gSearchProvider.off("browser-search-engine-modified", handler);
      resolve([name, data.name]);
    };
    gSearchProvider.on("browser-search-engine-modified", handler);
  });

  // set a new current engine
  Services.search.currentEngine = Services.search.getEngineByName(engineName);
  let expectedEngineName = Services.search.currentEngine.name;

  // emitter should fire and return the new engine
  let [eventName, actualEngineName] = yield promise;
  assert.equal(eventName, "browser-search-engine-modified", `emitter sent the correct event ${eventName}`);
  assert.equal(expectedEngineName, actualEngineName, `emitter set the correct engine ${expectedEngineName}`);
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
