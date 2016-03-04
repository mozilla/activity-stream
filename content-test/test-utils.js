const React = require("react");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");
const {dedupedSites} = require("selectors/selectors");
const TestUtils = require("react-addons-test-utils");

function createMockProvider(data = mockData) {
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

function renderWithProvider(Connected) {
  const ProviderWrapper = createMockProvider();
  return TestUtils.renderIntoDocument(<ProviderWrapper><Connected /></ProviderWrapper>);
}

module.exports = {
  rawMockData: mockData,
  mockData: dedupedSites(mockData),
  createMockProvider,
  renderWithProvider
};
