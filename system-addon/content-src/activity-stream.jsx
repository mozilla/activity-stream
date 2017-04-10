/* globals addMessageListener, removeMessageListener */
const React = require("react");
const ReactDOM = require("react-dom");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {reducers} = require("common/Reducers.jsm");

const store = initStore(reducers);

ReactDOM.render(<Provider store={store}><Base /></Provider>, document.getElementById("root"));
