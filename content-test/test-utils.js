const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");
const mockData = require("lib/fake-data");
const {selectNewTabSites} = require("common/selectors/selectors");
const TestUtils = require("react-addons-test-utils");
const {mount} = require("enzyme");

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

/**
 * For testing connected components with Enzyme.
 *
 * @param {ReactElement} component  The component to render.
 * @param {Object} store            The (typically fake) store to connect it to.
 * @return {ReactWrapper}           An Enzyme wrapper object from mount()
 */
function mountWithProvider(component, store) {
  const ProviderWrapper = createMockProvider(store && store);
  const containerWrapper = mount(<ProviderWrapper>{component}</ProviderWrapper>);
  return containerWrapper;
}

function overrideConsoleError(onError = () => {}) {
  const originalError = console.error; // eslint-disable-line no-console
  console.error = onError; // eslint-disable-line no-console
  return () => {
    console.error = originalError; // eslint-disable-line no-console
  };
}

function overrideGlobals(globalShims) {
  const originalGlobals = {};
  const keys = Object.keys(globalShims);
  keys.forEach(key => {
    originalGlobals[key] = global[key];
    global[key] = globalShims[key];
  });
  return function resetGlobals() {
    keys.forEach(key => {
      originalGlobals[key] = global[key];
    });
  };
}

module.exports = {
  rawMockData: mockData,
  mockData: Object.assign({}, mockData, selectNewTabSites(mockData)),
  createMockProvider,
  mountWithProvider,
  renderWithProvider,
  faker: require("test/faker"),
  overrideConsoleError,
  overrideGlobals
};
