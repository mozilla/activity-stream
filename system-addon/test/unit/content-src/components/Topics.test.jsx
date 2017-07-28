const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: Topics, Topic} = require("content-src/components/Topics/Topics");

describe("<Topics>", () => {
  it("should render a Topics element", () => {
    const wrapper = shallowWithIntl(<Topics topics={[]} />);
    assert.ok(wrapper.exists());
  });
  it("should render a Topic element for each topic with the right url", () => {
    const data = [{name: "topic1", url: "https://topic1.com"}, {name: "topic2", url: "https://topic2.com"}];

    const wrapper = shallow(<Topics topics={data} />);

    const topics = wrapper.find(Topic);
    assert.lengthOf(topics, 2);
    topics.forEach((topic, i) => assert.equal(topic.props().url, data[i].url));
  });
  it("should render read more link", () => {
    const readMoreEndpoint = "http://test-read-more.com";
    const wrapper = shallow(<Topics topics={[]} read_more_endpoint={readMoreEndpoint} />);

    const readMore = wrapper.find(".topic-read-more");
    assert.lengthOf(readMore, 1);
    assert.equal(readMore.props().href, readMoreEndpoint);
  });
});
