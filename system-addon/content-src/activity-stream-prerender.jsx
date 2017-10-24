const React = require("react");
const ReactDOM = require("react-dom/server");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {reducers, INITIAL_STATE} = require("common/Reducers.jsm");
const {actionTypes: at} = require("common/Actions.jsm");
const {PrerenderData} = require("common/PrerenderData.jsm");

/**
 * prerenderStore - Generate a store with the initial state required for a prerendered page
 *
 * @return {obj}         A store
 */
function prerenderStore() {
  const store = initStore(reducers, INITIAL_STATE);
  store.dispatch({type: at.PREFS_INITIAL_VALUES, data: PrerenderData.initialPrefs});
  PrerenderData.initialSections.forEach(data => store.dispatch({type: at.SECTION_REGISTER, data}));
  return store;
}

function prerender(locale, strings) {
  const store = prerenderStore();

  return {
    html: ReactDOM.renderToString(<Provider store={store}>
      <Base
        isPrerendered={true}
        locale={locale}
        strings={strings} />
    </Provider>),
    state: store.getState(),
    store
  };
}

module.exports = prerender;
module.exports.prerenderStore = prerenderStore;
