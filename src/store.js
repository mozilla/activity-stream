const {createStore, applyMiddleware, combineReducers} = require("redux");
const thunk = require("redux-thunk");
const reducers = require("reducers/reducers");

const middleware = [
  thunk
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

module.exports = store;
