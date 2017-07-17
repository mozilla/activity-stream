const React = require("react");
const ReactDOM = require("react-dom/server");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {childReducers, INITIAL_STATE} = require("common/Reducers.jsm");
const {actionTypes: at} = require("common/Actions.jsm");

function prerender(locale) {
  const store = initStore(childReducers, INITIAL_STATE);

  store.dispatch({
    type: at.LOCALE_UPDATED,
    data: {
      locale,
      strings: require("../data/locales.json")[locale]
    }
  });

  return {
    html: `<div id="root">${ReactDOM.renderToString(<Provider store={store}><Base /></Provider>)}</div>`,
    state: store.getState()
  };
}

module.exports = prerender;
