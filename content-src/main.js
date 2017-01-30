const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");
const Base = require("components/Base/Base");
const createStore = require("common/create-store");
const {ADDON_TO_CONTENT, CONTENT_TO_ADDON} = require("common/event-constants");
const {IntlProvider} = require("react-intl");
const strings = require("../locales/en-US/strings.json");

const store = createStore({
  incoming: ADDON_TO_CONTENT,
  outgoing: CONTENT_TO_ADDON,
  logger: __CONFIG__.LOGGING,
  rehydrate: true
});

const Root = React.createClass({
  render() {
    return (<Provider store={store}>
      <IntlProvider locale="en-US" messages={strings}>
        <Base />
      </IntlProvider>
    </Provider>);
  }
});

function renderRootWhenAddonIsReady() {
  if (window.navigator.activity_streams_addon || __CONFIG__.USE_SHIM) {
    ReactDOM.render(<Root />, document.getElementById("root"));
  } else {
    // If the content bridge to the addon isn't set up yet, try again soon.
    setTimeout(renderRootWhenAddonIsReady, 50);
  }
}

renderRootWhenAddonIsReady();
