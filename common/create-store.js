const vendor = require("common/vendor");
const {createStore, applyMiddleware, combineReducers} = vendor("redux");
const thunk = vendor("redux-thunk").default;
const reducers = require("common/reducers/reducers");
const {Channel} = require("common/ReduxChannel");
const parseUrlMiddleware = require("common/parse-url-middleware");
const loggerMiddleware = require("common/redux-logger");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {areSelectorsReady} = require("common/selectors/selectorUtils.js");

let store;

/**
 * rehydrateFromLocalStorage - Fetches initial state from local storage
 *
 * @return {obj}  Redux initial state as a plain object
 */
function rehydrateFromLocalStorage() {
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
  } catch (e) {
    // Nothing in local storage
  }
  return state;
}

/**
 * How frequently do we poll the store?
 *
 * @type {Number} milliseconds between polls
 */
const _rehydrationInterval = 1 * 1000; // try every second
let _rehydrationIntervalTimer = null;

/**
 * Polls the storeState for completion, and if found, dispatches MERGE_STORE.
 * Once that completes, test to see if we're ready, in which case we clear
 * the timer to stop polling
 *
 * @param  {Object} storeToRehydrate  the redux store to be rehydrated
 *                                    (defaults to store variable in this module)
 */
function _rehydrationIntervalCallback(storeToRehydrate = store) {
  if (!areSelectorsReady(storeToRehydrate.getState())) {
    storeToRehydrate.dispatch({type: "MERGE_STORE", data: rehydrateFromLocalStorage()});

    if (areSelectorsReady(storeToRehydrate.getState())) {
      clearInterval(_rehydrationIntervalTimer);
      store = null; // allow the reference to be GCed
    }
  }
}

/**
 * If we're going to need to rehydrate, start polling...
 */
function _startRehydrationPolling() {
  _rehydrationIntervalTimer = setInterval(_rehydrationIntervalCallback, _rehydrationInterval);
}

/**
 * A higher-order function which returns a reducer that, on MERGE_STORE action,
 * will return the action.data object merged into the previous state.
 *
 * For all other actions, it merely calls mainReducer.
 *
 * Because we want this to merge the entire state object, it's written as a
 * higher order function which takes the main reducer (itself often a call to
 * combineReducers) as a parameter.
 *
 * @param  {function} mainReducer reducer to call if action != "MERGE_STORE"
 * @return {function}             a reducer that, on "MERGE_STORE" action,
 *                                will return the action.data object merged
 *                                into the previous state, and the result
 *                                of calling mainReducer otherwise.
 */
function _mergeStateReducer(mainReducer) {
  return (prevState, action) => {
    if (action.type === "MERGE_STORE") {
      return Object.assign({}, prevState, action.data);
    }

    return mainReducer(prevState, action);
  };
}

/**
 * createActivityStreamStore - Creates a redux store for A.S.
 *
 * @param  {obj} options              Options for creating the store
 * @param  {type} options.incoming    Name of the incoming event for the channel
 * @param  {type} options.outgoing    Name of the outgoing event for the channel
 * @param  {type} options.logger      Use logging middleware?
 * @param  {type} options.rehydrate   Rehydrate state from locastorage on startup?
 * @return {obj}                      Redux store
 *
 * @note Because this module tracks the store for rehydration purposes,
 * it's currently only possible to have a single activity stream store per
 * content-space instance of the app.  It shouldn't be too much work to
 * refactor this to support multiple stores, however, should we ever want to do
 * that.
 */
module.exports = function createActivityStreamStore(options) {
  const {incoming, outgoing, logger, rehydrate, middleware} = options || {};

  // Add a channel if incoming and outgoing events were specified
  let channel;
  if (incoming && outgoing) {
    channel = new Channel({incoming, outgoing});
  }

  const mw = [
    thunk,
    parseUrlMiddleware
  ];

  if (channel) {
    mw.push(channel.middleware);
  }

  if (middleware) {
    mw.push(middleware);
  }

  // Logger should be last in the middleware array
  if (logger) {
    mw.push(loggerMiddleware);
  }

  let initialStore = rehydrate ? rehydrateFromLocalStorage() : {};

  store = createStore(
    _mergeStateReducer(combineReducers(reducers)),
    initialStore,
    applyMiddleware(...mw)
  );

  // we only want to rehydrate stores that are rehydratable, i.e. the content
  // stores.
  //
  if (rehydrate && !areSelectorsReady(store.getState())) {
    _startRehydrationPolling();
  }

  if (channel) {
    channel.connectStore(store);
  }

  return store;
};

module.exports.rehydrateFromLocalStorage = rehydrateFromLocalStorage;
module.exports._mergeStateReducer = _mergeStateReducer;
module.exports._startRehydrationPolling = _startRehydrationPolling;
module.exports._rehydrationIntervalCallback = _rehydrationIntervalCallback;
