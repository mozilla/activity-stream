const React = require("react");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");
const {selectNewTabSites} = require("selectors/selectors");
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

function renderWithProvider(component) {
  const ProviderWrapper = createMockProvider();
  const container = TestUtils.renderIntoDocument(<ProviderWrapper>{component}</ProviderWrapper>);
  return TestUtils.findRenderedComponentWithType(container, component.type);
}

module.exports = {
  rawMockData: mockData,
  mockData: Object.assign({}, mockData, selectNewTabSites(mockData)),
  createMockProvider,
  renderWithProvider
};
