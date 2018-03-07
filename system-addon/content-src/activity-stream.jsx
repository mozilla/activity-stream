import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {addSnippetsSubscriber} from "content-src/lib/snippets";
import {Base} from "content-src/components/Base/Base";
import {DetectUserSessionStart} from "content-src/lib/detect-user-session-start";
import {initStore} from "content-src/lib/init-store";
import {Provider} from "react-redux";
import Raven from "raven-js";
import React from "react";
import ReactDOM from "react-dom";
import {reducers} from "common/Reducers.jsm";

// Do this first so all possible subsequent errors are captured and sent
const ravenOptions = {
  allowSecretKey: true,
  release: "5e9f8ac3e67b81d30f0bd4ee3ab381503c42848e"
};

const sentryDsn = "https://8f7472f5a012407e9056a886648e91fd:883d9882e50847df83dad975a2f606ae@sentry.prod.mozaws.net/150";
Raven.config(sentryDsn, ravenOptions).install();

const store = initStore(reducers, global.gActivityStreamPrerenderedState);

new DetectUserSessionStart(store).sendEventOrAddListener();

// If we are starting in a prerendered state, we must wait until the first render
// to request state rehydration (see Base.jsx). If we are NOT in a prerendered state,
// we can request it immedately.
if (!global.gActivityStreamPrerenderedState) {
  store.dispatch(ac.AlsoToMain({type: at.NEW_TAB_STATE_REQUEST}));
}

ReactDOM.hydrate(<Provider store={store}>
  <Base
    isPrerendered={!!global.gActivityStreamPrerenderedState}
    locale={global.document.documentElement.lang}
    strings={global.gActivityStreamStrings} />
</Provider>, document.getElementById("root"));

addSnippetsSubscriber(store);
