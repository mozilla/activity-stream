const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");
const moment = require("moment");

const Routes = require("components/Routes/Routes");
const store = require("./store");

if (__CONFIG__.USE_SHIM) {
  require("lib/shim")();
}

// Custom relative time
moment.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s:  "<1m",
    m:  "%dm",
    mm:  "%dm",
    h:  "%dh",
    hh:  "%dh",
    d:  "%dd",
    dd:  "%dd",
    M:  "%dM",
    MM:  "%dM",
    y:  "%dy",
    yy:  "%dy"
  }
});

const Root = React.createClass({
  render() {
    return (<Provider store={store}>
      <Routes />
    </Provider>);
  }
});

function renderRootWhenAddonIsReady() {
  if (window.navigator.activity_streams_addon) {
    ReactDOM.render(<Root />, document.getElementById("root"));
  } else {
    // If the content bridge to the addon isn't set up yet, try again soon.
    setTimeout(renderRootWhenAddonIsReady, 50);
  }
}

renderRootWhenAddonIsReady();
