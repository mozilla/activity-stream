const React = require("react");
const ReactDOM = require("react-dom");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {reducers} = require("common/Reducers.jsm");
const DetectUserSessionStart = require("content-src/lib/detect-user-session-start");
const {addSnippetsSubscriber} = require("content-src/lib/snippets");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

const store = initStore(reducers, global.gActivityStreamPrerenderedState);

new DetectUserSessionStart(store).sendEventOrAddListener();

// If we are starting in a prerendered state, we must wait until the first render
// to request state rehydration (see Base.jsx). If we are NOT in a prerendered state,
// we can request it immedately.
if (!global.gActivityStreamPrerenderedState) {
  store.dispatch(ac.SendToMain({type: at.NEW_TAB_STATE_REQUEST}));
}

ReactDOM.render(<Provider store={store}>
  <Base
    isPrerendered={!!global.gActivityStreamPrerenderedState}
    locale={global.document.documentElement.lang}
    strings={global.gActivityStreamStrings} />
</Provider>, document.getElementById("root"));

addSnippetsSubscriber(store);
