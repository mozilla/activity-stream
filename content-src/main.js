const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");

const Routes = require("components/Routes/Routes");
const store = require("./store");

require("lib/shim")();

class Root extends React.Component {
  render() {
    return (<Provider store={store}>
      <Routes />
    </Provider>);
  }
}

ReactDOM.render(<Root />, document.getElementById("root"));
