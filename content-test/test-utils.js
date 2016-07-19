const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");
const {selectNewTabSites} = require("selectors/selectors");
const TestUtils = require("react-addons-test-utils");

const DEFAULT_STORE = {
  getState: () => mockData,
  dispatch: () => {},
  subscribe: () => {}
};

function createMockProvider(custom) {
  const store = Object.assign({}, DEFAULT_STORE, custom);
  store.subscribe = () => {};
  return React.createClass({
    render() {
      return (<Provider store={store}>{this.props.children}</Provider>);
    }
  });
}

function renderWithProvider(component, store, node) {
  const ProviderWrapper = createMockProvider(store && store);
  const render = node ? instance => ReactDOM.render(instance, node) : TestUtils.renderIntoDocument;
  const container = render(<ProviderWrapper>{component}</ProviderWrapper>);
  return TestUtils.findRenderedComponentWithType(container, component.type);
}

function overrideConsoleError(onError = () => {}) {
  const originalError = console.error; // eslint-disable-line no-console
  console.error = onError; // eslint-disable-line no-console
  return () => {
    console.error = originalError; // eslint-disable-line no-console
  };
}

module.exports = {
  rawMockData: mockData,
  mockData: Object.assign({}, mockData, selectNewTabSites(mockData), {showRecommendationOption: true}),
  createMockProvider,
  renderWithProvider,
  faker: require("test/faker"),
  overrideConsoleError
};
