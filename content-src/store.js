const {createStore, applyMiddleware, combineReducers} = require("redux");
const {ADDON_TO_CONTENT, CONTENT_TO_ADDON} = require("common/event-constants");
const thunk = require("redux-thunk");
const reducers = require("reducers/reducers");
const {Channel} = require("lib/ReduxChannel");

const channel = new Channel({
  incoming: ADDON_TO_CONTENT,
  outgoing: CONTENT_TO_ADDON
});

const middleware = [
  thunk,
  channel.middleware,
  require("lib/parse-url-middleware"),
];

// Logging for debugging redux actions
if (__CONFIG__.LOGGING) {
  const createLogger = require("redux-logger");
  middleware.push(createLogger({
    level: "info",
    collapsed: true
  }));
}

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(...middleware)
);

channel.connectStore(store);

module.exports = store;
