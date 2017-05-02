const React = require("react");
const {shallow} = require("enzyme");
const {_unconnected: TopSites, TopSite} = require("content-src/components/TopSites/TopSites");

const DEFAULT_PROPS = {
  TopSites: {rows: []},
  dispatch() {}
};

describe("<TopSites>", () => {
  it("should render a TopSites element", () => {
    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });
  it("should render a TopSite for each link with the right url", () => {
    const rows = [{url: "https://foo.com"}, {url: "https://bar.com"}];

    const wrapper = shallow(<TopSites {...DEFAULT_PROPS} TopSites={{rows}} />);

    const links = wrapper.find(TopSite);
    assert.lengthOf(links, 2);
    links.forEach((link, i) => assert.equal(link.props().url, rows[i].url));
  });
});

describe("<TopSite>", () => {
  it("should render a TopSite", () => {
    const wrapper = shallow(<TopSite url="https://foo.com" screenshot="foo.jpg" />);
    assert.ok(wrapper.exists());
  });
  it("should add the right url", () => {
    const wrapper = shallow(<TopSite url="https://www.foobar.org" />);
    assert.propertyVal(wrapper.find("a").props(), "href", "https://www.foobar.org");
  });
  it("should render a shortened title based off the url", () => {
    const wrapper = shallow(<TopSite url="https://www.foobar.org" eTLD={"org"} />);
    const titleEl = wrapper.find(".title");

    assert.equal(titleEl.text(), "foobar");
  });
  it("should render the first letter of the title as a fallback for missing screenshots", () => {
    const wrapper = shallow(<TopSite url="https://www.foo.com" screenshot="foo.jpg" />);
    assert.equal(wrapper.find(".letter-fallback").text(), "f");
  });
  it("should render a screenshot with the .active class, if it is provided", () => {
    const wrapper = shallow(<TopSite url="https://foo.com" screenshot="foo.jpg" />);
    const screenshotEl = wrapper.find(".screenshot");

    assert.propertyVal(screenshotEl.props().style, "backgroundImage", "url(foo.jpg)");
    assert.isTrue(screenshotEl.hasClass("active"));
  });
  it("should not add the .active class to the screenshot element if no screenshot prop is provided", () => {
    const wrapper = shallow(<TopSite url="https://foo.com" />);
    assert.isFalse(wrapper.find(".screenshot").hasClass("active"));
  });
});
