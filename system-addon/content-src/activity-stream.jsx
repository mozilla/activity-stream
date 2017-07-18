const React = require("react");
const ReactDOM = require("react-dom");
const Base = require("content-src/components/Base/Base");
const {Provider} = require("react-redux");
const initStore = require("content-src/lib/init-store");
const {reducers} = require("common/Reducers.jsm");
const DetectUserSessionStart = require("content-src/lib/detect-user-session-start");
const {SnippetsProvider} = require("content-src/lib/snippets");

new DetectUserSessionStart().sendEventOrAddListener();

const store = initStore(reducers);

ReactDOM.render(<Provider store={store}><Base /></Provider>, document.getElementById("root"));

// Trigger snippets when snippets data has been received.
const snippets = new SnippetsProvider();
const unsubscribe = store.subscribe(() => {
  const state = store.getState();
  if (state.Snippets.initialized) {
    snippets.init({
      snippetsURL: state.Snippets.snippetsURL,
      version: state.Snippets.version,
      // TODO: We need to enable IndexedDB on about:newtab to be able to connect to it.
      connect: false
    });
    unsubscribe();
  }
});
