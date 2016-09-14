/* globals describe, beforeEach, afterEach, it */
const ConnectedHeader = require("components/Header/Header");
const {Header} = ConnectedHeader;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {overrideConsoleError, renderWithProvider} = require("test/test-utils");
const fakeProps = {
  title: "Home",
  pathname: "/"
};

describe("Header", () => {
  let header;
  let el;
  function setup(customProps = {}) {
    const props = Object.assign({}, fakeProps, customProps);
    const connected = renderWithProvider(<ConnectedHeader {...props} />);
    header = TestUtils.findRenderedComponentWithType(connected, Header);
    el = ReactDOM.findDOMNode(header);
  }

  beforeEach(setup);

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      const restore = overrideConsoleError();
      renderWithProvider(<ConnectedHeader />);
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
    header = renderWithProvider(<Header {...fakeProps} disabled={true} />);
    assert.isTrue(header.refs.caret.hidden);
  });

  it("should not set showDropdown on click if props.disabled", () => {
    header = renderWithProvider(<Header {...fakeProps} disabled={true} />);
    TestUtils.Simulate.click(header.refs.clickElement);
    assert.isFalse(header.state.showDropdown);
  });

  it("should send search query event on filter change", done => {
    const props = Object.assign({}, fakeProps, {
      dispatch(action) {
        assert.equal(action.type, "NOTIFY_FILTER_QUERY");
        assert.equal(action.data, "hello");
        done();
      }
    });
    const instance = TestUtils.renderIntoDocument(<Header {...props} />);
    let el = instance.refs.filter;
    el.value = "hello";
    TestUtils.Simulate.change(el);
  });

  it("should update state on filter change", () => {
    assert.equal(header.state.filterQuery, "");

    let el = header.refs.filter;
    el.value = "hello";
    TestUtils.Simulate.change(el);

    assert.equal(header.state.filterQuery, "hello");
  });

  it("should not have a filter dismiss by default", () => {
    assert.isUndefined(header.refs.filterDismiss);
  });

  it("should have a filter dismiss on filter change", () => {
    let el = header.refs.filter;
    el.value = "hello";
    TestUtils.Simulate.change(el);

    assert.ok(header.refs.filterDismiss);
  });

  it("should clear search on dismiss", () => {
    let el = header.refs.filter;
    el.value = "hello";
    TestUtils.Simulate.change(el);
    TestUtils.Simulate.click(header.refs.filterDismiss);

    assert.isUndefined(header.refs.filterDismiss);
    assert.equal(header.state.filterQuery, "");
  });

  describe("userImage", () => {
    it("should not have an img element if no user image is provided", () => {
      assert.isNull(el.querySelector(".user-info img"));
    });

    it("should have an img element if a user image is provided ", () => {
      const connected = renderWithProvider(<Header {...fakeProps} userImage="https://foo.com/user.jpg" />);
      header = TestUtils.findRenderedComponentWithType(connected, Header);
      el = ReactDOM.findDOMNode(header);
      const imgEl = el.querySelector(".user-info img");
      assert.ok(imgEl);
      assert.include(imgEl.src, "https://foo.com/user.jpg");
    });
  });
});
