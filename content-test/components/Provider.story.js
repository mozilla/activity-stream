const React = require("react");
const {Provider} = require("react-redux");

const Routes = require("components/Routes/Routes");
const store = require("../../content-src/store");

const {storiesOf} = require("@kadira/storybook");

require("lib/shim")();

const ProviderContainer = React.createClass({
  render() {
    return (<Provider store={store}>
      <Routes />
    </Provider>);
  }
});

storiesOf("Provider", module)
  .add("default properties", () => (
    <ProviderContainer />
  ));
