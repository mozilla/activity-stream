const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");

describe("LinkMenuButton", () => {
  it("should render", () => {
    let instance = TestUtils.renderIntoDocument(<LinkMenuButton onClick={() => {}} />);
    assert.ok(instance);
  });
  it("should preventDefault and call onClick when clicked", done => {
    let preventDefaultCalled = false;
    let instance = TestUtils.renderIntoDocument(<LinkMenuButton onClick={e => {
      assert.isTrue(preventDefaultCalled, "preventDefault was called");
      done();
    }} />);
    TestUtils.Simulate.click(ReactDOM.findDOMNode(instance), {preventDefault: () => {
      preventDefaultCalled = true;
    }});
  });
});
