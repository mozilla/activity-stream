import {INITIAL_STATE, reducers} from "common/Reducers.jsm";
import {actionTypes as at} from "common/Actions.jsm";
import {Base} from "content-src/components/Base/Base";
import {initStore} from "content-src/lib/init-store";
import {PrerenderData} from "common/PrerenderData.jsm";
import {Provider} from "react-redux";
import React from "react";
import ReactDOM from "react-dom/server";

/**
 * prerenderStore - Generate a store with the initial state required for a prerendered page
 *
 * @return {obj}         A store
 */
export function prerenderStore() {
  const store = initStore(reducers, INITIAL_STATE);
  store.dispatch({type: at.PREFS_INITIAL_VALUES, data: PrerenderData.initialPrefs});
  PrerenderData.initialSections.forEach(data => store.dispatch({type: at.SECTION_REGISTER, data}));
  return store;
}

export function prerender(locale, strings) {
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
