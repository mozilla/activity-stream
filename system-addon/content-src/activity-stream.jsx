const React = require("react");
const ReactDOM = require("react-dom");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {childReducers} = require("common/Reducers.jsm");
const DetectUserSessionStart = require("content-src/lib/detect-user-session-start");

new DetectUserSessionStart().sendEventOrAddListener();

const store = initStore(childReducers, window._INITIAL_STATE);

ReactDOM.render(<Provider store={store}><Base /></Provider>, document.getElementById("root"));
