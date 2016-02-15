const React = require("react");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");

module.exports = {
  mockData,
  createMockProvider(data = mockData) {
    const store = {
      getState: () => data,
      dispatch: () => {},
      subscribe: () => {}
    };
    store.subscribe = () => {};
    return React.createClass({
      render() {
        return (<Provider store={store}>{this.props.children}</Provider>);
      }
    });
  }
};
