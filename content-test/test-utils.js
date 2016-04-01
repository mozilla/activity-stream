const React = require("react");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");
const {selectNewTabSites} = require("selectors/selectors");
const TestUtils = require("react-addons-test-utils");

const DEFAULT_STORE = {
  getState: () => mockData,
  dispatch: () => {},
  subscribe: () => {}
};

function createMockProvider(custom = {}) {
  const store = Object.assign({}, DEFAULT_STORE, custom);
  store.subscribe = () => {};
  return React.createClass({
    render() {
      return (<Provider store={store}>{this.props.children}</Provider>);
    }
  });
}

function renderWithProvider(component, store) {
  const ProviderWrapper = createMockProvider(store);
  const container = TestUtils.renderIntoDocument(<ProviderWrapper>{component}</ProviderWrapper>);
  return TestUtils.findRenderedComponentWithType(container, component.type);
}

module.exports = {
  rawMockData: mockData,
  mockData: Object.assign({}, mockData, selectNewTabSites(mockData)),
  createMockProvider,
  renderWithProvider,
  faker: require("test/faker")
};
