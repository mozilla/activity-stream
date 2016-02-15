const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");

const Routes = require("components/Routes/Routes");
const store = require("./store");

// if (__CONFIG__.USE_SHIM) {
//   require("lib/shim")();
// }

const Root = React.createClass({
  render() {
    return (<Provider store={store}>
      <Routes />
    </Provider>);
  }
});

ReactDOM.render(<Root />, document.getElementById("root"));
