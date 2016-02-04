const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");

const Base = require("components/Base/Base");
const store = require("./store");

require('lib/shim')();

const Root = React.createClass({
  render() {
    return (<Provider store={store}>
      <Base />
    </Provider>);
  }
});

module.exports = Root;
ReactDOM.render(<Root />, document.getElementById("root"));
