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
  channel.middleware
];

// Logging for debugging redux actions
if (__CONFIG__.LOGGING) {
  const createLogger = require("redux-logger");
  middleware.push(createLogger({
    level: "info",
    collapsed: true
  }));
}

if (__CONFIG__.FAKE_DATA) {
  middleware.push(require("lib/fake-data-middleware"));
}

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(...middleware)
);

channel.connectStore(store);

module.exports = store;
