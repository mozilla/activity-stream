const React = require("react");
const {createMockProvider} = require("test/test-utils");
const {mountWithIntl} = require("test/test-utils");

const Base = require("components/Base/Base");
const NewTabPage = require("components/NewTabPage/NewTabPage");
const Provider = createMockProvider();

describe("Base", () => {
  let instance;
  beforeEach(() => {
    instance = mountWithIntl(<Provider><Base /></Provider>, {context: {}, childContextTypes: {}});
  });

  it("should render NewTabPage by default", () => {
    assert.ok(instance.find(NewTabPage));
  });
});
