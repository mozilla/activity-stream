const React = require("react");
const TestUtils = require("react-addons-test-utils");
const {createMockProvider} = require("test/test-utils");

const Base = require("components/Base/Base");
const NewTabPage = require("components/NewTabPage/NewTabPage");

const Provider = createMockProvider();

describe("Base", () => {
  let instance;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<Provider><Base /></Provider>);
  });

  it("should render NewTabPage by default", () => {
    assert.ok(TestUtils.findRenderedComponentWithType(instance, NewTabPage));
  });
});
