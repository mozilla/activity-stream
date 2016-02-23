const {assert} = require("chai");
const Search = require("components/Search/Search");
const React = require("react");
const TestUtils = require("react-addons-test-utils");

describe("Search", () => {
  it("should not throw if onSearch is not provided", () => {
    const instance = TestUtils.renderIntoDocument(<Search />);
    assert.doesNotThrow(() => {
      TestUtils.Simulate.click(instance.refs.button);
    });
  });
  it("should call onSearch callback with input value when button is pressed", done => {
    function onSearch(value) {
      assert.equal(value, "foo");
      done();
    }
    const instance = TestUtils.renderIntoDocument(<Search onSearch={onSearch} />);
    const button = instance.refs.button;
    const input = instance.refs.input;
    input.value = "foo";
    TestUtils.Simulate.change(input);
    TestUtils.Simulate.click(button);
  });
});
