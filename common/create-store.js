const vendor = require("common/vendor");
const {createStore, applyMiddleware, combineReducers} = vendor("redux");
const thunk = vendor("redux-thunk").default;
const reducers = require("common/reducers/reducers");
const {Channel} = require("common/ReduxChannel");
const parseUrlMiddleware = require("common/parse-url-middleware");
const loggerMiddleware = require("common/redux-logger");
const {LOCAL_STORAGE_KEY} = require("common/constants");

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
 * createActivityStreamStore - Creates a redux store for A.S.
 *
 * @param  {obj} options              Options for creating the store
 * @param  {type} options.incoming    Name of the incoming event for the channel
 * @param  {type} options.outgoing    Name of the outgoing event for the channel
 * @param  {type} options.logger      Use logging middleware?
 * @param  {type} options.rehydrate   Rehydrate state from locastorage on startup?
 * @return {obj}                      Redux store
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

  const store = createStore(
    combineReducers(reducers),
    rehydrate ? rehydrateFromLocalStorage() : {},
    applyMiddleware(...mw)
  );

  if (channel) {
    channel.connectStore(store);
  }

  return store;
};

module.exports.rehydrateFromLocalStorage = rehydrateFromLocalStorage;
