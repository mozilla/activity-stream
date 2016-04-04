const {createStore, applyMiddleware, combineReducers} = require("redux");
const thunk = require("redux-thunk");
const reducers = require("reducers/reducers");
const {Channel} = require("lib/ReduxChannel");

const channel = new Channel({
  incoming: "addon-to-content",
  outgoing: "content-to-addon"
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
