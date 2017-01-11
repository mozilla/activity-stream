const React = require("react");
const Snippet = require("components/Snippet/Snippet");
const {shallow, render} = require("enzyme");

const validProps = {
  visible: true,
  title: "Snippet Headline",
  image: "https://support.cdn.mozilla.net/static/sumo/img/firefox-512.png?v=1",
  description: "Your snippet text goes here and should not be any longer than a Tweet, (140 characters). <a href='#'>Links should look like this.</a>",
  setVisibility: () => {}
};

function createWrapper(custom = {}) {
  return shallow(<Snippet {...Object.assign({}, validProps, custom)} />);
}

describe("Snippet", () => {
  it("should render a snippet", () => {
    assert.ok(createWrapper());
  });
  describe(".visible", () => {
    it("should not be hidden be default", () => {
      assert.isFalse(createWrapper().hasClass("hide-with-fade-out"));
    });
    it("should hide the snippet if props.visible is false", () => {
      const wrapper = createWrapper({visible: false});
      assert(wrapper.hasClass("hide-with-fade-out"));
    });
  });
  describe(".setVisibility", () => {
    it("should call props.setVisibility with false when the close button is clicked", () => {
      const setVisibility = sinon.spy();
      const wrapper = createWrapper({setVisibility});

      wrapper.find(".snippet-close-button")
        .simulate("click", {preventDefault: () => {}});

      assert.calledWith(setVisibility, false);
    });
  });
  describe(".title", () => {
    it("should show the title prop", () => {
      const wrapper = createWrapper({title: "Foo bar"});
      assert.equal(wrapper.find(".snippet-title").text(), "Foo bar");
    });
    it("should hide the title element if no title is given", () => {
      const wrapper = createWrapper({title: null});
      assert.lengthOf(wrapper.find(".snippet-title"), 0);
    });
  });
  describe(".description", () => {
    it("should show the description prop", () => {
      // shallow rendering isn't good enough here, since the impl uses
      // dangerouslySetInnerHTML
      const wrapper = render(
        <Snippet {...Object.assign({}, validProps, {description: "Foo bar"})} />);
      assert.equal(wrapper.find(".snippet-description").text(), "Foo bar");
    });
  });
  describe(".image", () => {
    it("should show the image prop", () => {
      const wrapper = createWrapper();
      assert.equal(wrapper.find(".snippet-image").prop("style").backgroundImage,
        `url(${validProps.image})`);
    });
    it("should add the .placeholder class if no image is supplied", () => {
      const wrapper = createWrapper({image: null});
      assert(wrapper.find(".snippet-image").hasClass("placeholder"));
    });
  });
});
