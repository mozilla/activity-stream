const React = require("react");
const {mount} = require("enzyme");

const TestComponent = props => (<FormattedMessage id="test_message" />);
const {Base} = require("inject!components/Base/Base")({"components/NewTabPage/NewTabPage": TestComponent});
const {FormattedMessage} = require("react-intl");

describe("Base", () => {
  it("should render with a non-en language", () => {
    const props = {Intl: {locale: "fr", strings: {test_message: "Bonjour"}, direction: "ltr"}, dispatch: () => {}};
    const wrapper = mount(<Base {...props} />);
    assert.equal(wrapper.find(FormattedMessage).text(), "Bonjour");
  });
  it("should support changing a language", () => {
    const props = {Intl: {locale: "fr", strings: {test_message: "Bonjour"}, direction: "ltr"}, dispatch: () => {}};
    const wrapper = mount(<Base {...props} />);
    wrapper.setProps({Intl: {locale: "zh-CN", strings: {test_message: "你好"}, direction: "ltr"}});
    assert.equal(wrapper.find(FormattedMessage).text(), "你好");
  });
});
