const React = require("react");
const ReactDOM = require("react-dom/server");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {reducers, INITIAL_STATE} = require("common/Reducers.jsm");
const {actionTypes: at} = require("common/Actions.jsm");
const allStrings = require("../data/locales.json");
const {PrerenderData} = require("common/PrerenderData.jsm");

const EMPTY_LOCALE = "en-PRERENDER";

/**
 * prerenderStore - Generate a store with the initial state required for a prerendered page
 *
 * @param  {str} locale  The locale to start with. This is probably en-PRERENDER.
 * @param  {type} strings All the strings for the page
 * @return {obj}         A store
 */
function prerenderStore(locale = "", strings) {
  const store = initStore(reducers, INITIAL_STATE);
  store.dispatch({type: at.LOCALE_UPDATED, data: {locale, strings}});
  store.dispatch({type: at.PREFS_INITIAL_VALUES, data: PrerenderData.initialPrefs});
  PrerenderData.initialSections.forEach(data => store.dispatch({type: at.SECTION_REGISTER, data}));
  return store;
}

function prerender(_locale) {
  const locale = _locale || EMPTY_LOCALE;
  let strings = {};

  if (locale !== EMPTY_LOCALE) {
    if (!allStrings[locale]) {
      throw new Error(`Tried to get strings for ${locale} but none were found.`);
    }
    strings = allStrings[locale];
  } else {
    Object.keys(allStrings["en-US"]).forEach(key => {
      if (key === "search_web_placeholder") {
        // TODO: This is a special case to allow us to render a placeholder string
        // for search, which is needed for certain Quantum perf tests. We will
        // remove this when issue #3370 is resolved.
        strings[key] = allStrings["en-US"][key];
      } else {
        strings[key] = " ";
      }
    });
  }

  const store = prerenderStore(locale, strings);

  return {
    html: ReactDOM.renderToString(<Provider store={store}><Base isPrerendered={true} /></Provider>),
    state: store.getState(),
    store
  };
}

module.exports = prerender;
module.exports.prerenderStore = prerenderStore;
