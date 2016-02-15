const React = require("react");
const TestUtils = require("react-addons-test-utils");
const {createMockProvider} = require("test/test-utils");
const {Router} = require("react-router");

const Routes = require("components/Routes/Routes");
const NewTabPage = require("components/NewTabPage/NewTabPage");
const Provider = createMockProvider();

describe("Router", () => {
  let instance;

  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<Provider><Routes /></Provider>);
  });

  it("should render routes", () => {
    TestUtils.findRenderedComponentWithType(instance, Router);
  });

  it("should render NewTabPage by default", () => {
    TestUtils.findRenderedComponentWithType(instance, NewTabPage);
  });
});
