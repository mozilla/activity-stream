const React = require("react");
const Snippet = require("components/Snippet/Snippet");
const TestUtils = require("react-addons-test-utils");
const ReactDOM = require("react-dom");

const validProps = {
  visible: true,
  title: "Snippet Headline",
  image: "https://support.cdn.mozilla.net/static/sumo/img/firefox-512.png?v=1",
  description: "Your snippet text goes here and should not be any longer than a Tweet, (140 characters). <a href='#'>Links should look like this.</a>",
  setVisibility: () => {}
};

function createInstance(custom = {}) {
  return TestUtils.renderIntoDocument(<Snippet {...Object.assign({}, validProps, custom)} />);
}

describe("Snippet", () => {
  it("should render a snippet", () => {
    assert.ok(createInstance());
  });
  describe(".visible", () => {
    it("should not be hidden be default", () => {
      assert.notInclude(ReactDOM.findDOMNode(createInstance()).className, "hide-with-fade-out");
    });
    it("should hide the snippet if props.visible is false", () => {
      const instance = createInstance({visible: false});
      assert.include(ReactDOM.findDOMNode(instance).className, "hide-with-fade-out");
    });
  });
  describe(".setVisibility", () => {
    it("should call props.setVisibility with false when the close button is clicked", () => {
      const setVisibility = sinon.spy();
      const instance = createInstance({setVisibility});
      TestUtils.Simulate.click(instance.refs.closeButton);
      assert.calledWith(setVisibility, false);
    });
  });
  describe(".title", () => {
    it("should show the title prop", () => {
      const instance = createInstance({title: "Foo bar"});
      assert.equal(instance.refs.title.textContent, "Foo bar");
    });
    it("should hide the title element if no title is given", () => {
      const instance = createInstance({title: null});
      assert.isUndefined(instance.refs.title);
    });
  });
  describe(".description", () => {
    it("should show the description prop", () => {
      const instance = createInstance({description: "Foo bar"});
      assert.equal(instance.refs.description.textContent, "Foo bar");
    });
  });
  describe(".image", () => {
    it("should show the image prop", () => {
      const instance = createInstance();
      assert.equal(instance.refs.image.style.backgroundImage, `url("${validProps.image}")`);
    });
    it("should add the .placeholder class if no image is supplied", () => {
      const instance = createInstance({image: null});
      assert.include(instance.refs.image.className, "placeholder");
    });
  });
});
