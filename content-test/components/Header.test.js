/* globals describe, beforeEach, afterEach, it */
const Header = require("components/Header/Header");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {overrideConsoleError} = require("test/test-utils");
const fakeProps = {
  title: "Home",
  pathname: "/"
};

describe("Header", () => {
  let node;
  let header;
  let el;
  beforeEach(() => {
    node = document.createElement("div");
    header = ReactDOM.render(<Header {...fakeProps} />, node);
    el = ReactDOM.findDOMNode(header);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      const restore = overrideConsoleError();
      ReactDOM.render(<Header />, node);
      restore();
    });
  });

  it("should hide dropdown be default", () => {
    assert.isTrue(header.refs.dropdown.hidden);
  });

  it("should show dropdown on click", () => {
    TestUtils.Simulate.click(header.refs.clickElement);
    assert.isTrue(header.state.showDropdown);
    assert.isFalse(header.refs.dropdown.hidden);
  });

  it("should show caret/arrow by default", () => {
    assert.isFalse(header.refs.caret.hidden);
  });

  it("should not show caret/arrow if props.disabled is true", () => {
    header = ReactDOM.render(<Header {...fakeProps} disabled={true} />, node);
    assert.isTrue(header.refs.caret.hidden);
  });

  it("should not set showDropdown on click if props.disabled", () => {
    header = ReactDOM.render(<Header {...fakeProps} disabled={true} />, node);
    TestUtils.Simulate.click(header.refs.clickElement);
    assert.isFalse(header.state.showDropdown);
  });

  describe("userImage", () => {
    it("should not have an img element if no user image is provided", () => {
      assert.isNull(el.querySelector(".user-info img"));
    });

    it("should have an img element if a user image is provided ", () => {
      ReactDOM.render(<Header {...fakeProps} userImage="https://foo.com/user.jpg" />, node);
      const imgEl = el.querySelector(".user-info img");
      assert.ok(imgEl);
      assert.include(imgEl.src, "https://foo.com/user.jpg");
    });
  });
});
