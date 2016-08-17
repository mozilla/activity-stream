/* globals Services */
"use strict";

const {SearchProvider} = require("addon/SearchProvider");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");

// create dummy test engines for testing
Services.search.addEngineWithDetails("TestSearch1", "", "", "", "GET",
  "http://example.com/?q={searchTerms}");
Services.search.addEngineWithDetails("TestSearch2", "", "", "", "GET",
  "http://example.com/?q={searchTerms}");
// set one of the dummy test engines to the default engine
Services.search.defaultEngine = Services.search.getEngineByName("TestSearch1");

function hasProp(assert, obj) {
  return function(aProp) {
    assert.ok({}.hasOwnProperty.call(obj, aProp), `expect to have property ${aProp}`);
  };
}

exports.test_SearchProvider_state = function*(assert) {
  // get inital state of search and check that it has the corret properties
  let state = yield SearchProvider.search.asyncGetCurrentState();
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
  SearchProvider.search.init();

  // event emitter will fire when current engine is changed
  let promise = new Promise(resolve => {
    SearchProvider.search.once("browser-search-engine-modified", (name, data) => { // jshint ignore:line
      resolve([name, data.name]);
    });
  });

  // set a new current engine
  Services.search.currentEngine = Services.search.getEngineByName(engineName);
  let expectedEngineName = Services.search.currentEngine.name;

  // emitter should fire and return the new engine
  let [eventName, actualEngineName] = yield promise;
  assert.equal(eventName, "browser-search-engine-modified", `emitter sent the correct event ${eventName}`);
  assert.equal(expectedEngineName, actualEngineName, `emitter set the correct engine ${expectedEngineName}`);
  SearchProvider.search.uninit();
};

require("sdk/test").run(exports);
