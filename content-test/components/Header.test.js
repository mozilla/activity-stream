/* globals describe, beforeEach, afterEach, it */

const assert = require("chai").assert;
const Header = require("components/Header/Header");
const React = require("react");
const ReactDOM = require("react-dom");

const fakeProps = {
  currentRoute: {
    title: "Home",
    path: "/"
  }
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
