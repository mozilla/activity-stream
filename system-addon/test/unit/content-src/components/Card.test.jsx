const React = require("react");
const {shallow} = require("enzyme");
const {mountWithIntl} = require("test/unit/utils");
const Card = require("content-src/components/Card/Card");
const {PlaceholderCard} = Card;
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const cardContextTypes = require("content-src/components/Card/types");

let DEFAULT_PROPS = {
  dispatch: sinon.stub(),
  index: 0,
  link: {
    hostname: "foo",
    title: "A title for foo",
    url: "http://www.foo.com",
    type: "history",
    description: "A description for foo",
    image: "http://www.foo.com/img.png",
    guid: 1
  },
  eventSource: "TOP_STORIES",
  shouldSendImpressionStats: true,
  contextMenuOptions: ["Separator"]
};

describe("<Card>", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mountWithIntl(<Card {...DEFAULT_PROPS} />);
  });
  it("should render a Card component", () => assert.ok(wrapper.exists()));
  it("should add the right url", () => assert.propertyVal(wrapper.find("a").props(), "href", DEFAULT_PROPS.link.url));
  it("should display a title", () => assert.equal(wrapper.find(".card-title").text(), DEFAULT_PROPS.link.title));
  it("should display a description", () => (
    assert.equal(wrapper.find(".card-description").text(), DEFAULT_PROPS.link.description))
  );
  it("should display a host name", () => assert.equal(wrapper.find(".card-host-name").text(), "foo"));
  it("should display an image if there is one, with the correct background", () => (
    assert.equal(wrapper.find(".card-preview-image").props().style.backgroundImage, `url(${DEFAULT_PROPS.link.image})`))
  );
  it("should not show an image if there isn't one", () => {
    const link = Object.assign({}, DEFAULT_PROPS.link);
    delete link.image;

    wrapper = mountWithIntl(<Card {...Object.assign({}, DEFAULT_PROPS, {link})} />);

    assert.lengthOf(wrapper.find(".card-preview-image"), 0);
  });
  it("should have a link menu", () => assert.ok(wrapper.find(LinkMenu)));
  it("should have a link menu button", () => assert.ok(wrapper.find(".context-menu-button")));
  it("should render a link menu when button is clicked", () => {
    const button = wrapper.find(".context-menu-button");
    assert.equal(wrapper.find(LinkMenu).props().visible, false);
    button.simulate("click", {preventDefault: () => {}});
    assert.equal(wrapper.find(LinkMenu).props().visible, true);
  });
  it("should pass dispatch, source, visible, onUpdate, site, options, and index to LinkMenu", () => {
    const {dispatch, source, visible, onUpdate, site, options, index} = wrapper.find(LinkMenu).props();
    assert.equal(dispatch, DEFAULT_PROPS.dispatch);
    assert.equal(source, DEFAULT_PROPS.eventSource);
    assert.equal(visible, false);
    assert.ok(onUpdate);
    assert.equal(site, DEFAULT_PROPS.link);
    assert.equal(options, DEFAULT_PROPS.contextMenuOptions);
    assert.equal(index, DEFAULT_PROPS.index);
  });
  it("should pass through the correct menu options to LinkMenu if overridden by individual card", () => {
    const link = Object.assign({}, DEFAULT_PROPS.link);
    link.contextMenuOptions = ["CheckBookmark"];

    wrapper = mountWithIntl(<Card {...Object.assign({}, DEFAULT_PROPS, {link})} />);

    const {options} = wrapper.find(LinkMenu).props();
    assert.equal(options, link.contextMenuOptions);
  });
  it("should have a context based on type", () => {
    wrapper = shallow(<Card {...DEFAULT_PROPS} />);
    const context = wrapper.find(".card-context");
    const {icon, intlID} = cardContextTypes[DEFAULT_PROPS.link.type];
    assert.isTrue(context.childAt(0).hasClass(`icon-${icon}`));
    assert.isTrue(context.childAt(1).hasClass("card-context-label"));
    assert.equal(context.childAt(1).props().children.props.id, intlID);
  });
  it("should support setting custom context", () => {
    const linkWithCustomContext = {
      type: "history",
      context: "Custom",
      icon: "icon-url"
    };

    wrapper = shallow(<Card {...Object.assign({}, DEFAULT_PROPS, {link: linkWithCustomContext})} />);
    const context = wrapper.find(".card-context");
    const {icon} = cardContextTypes[DEFAULT_PROPS.link.type];
    assert.isFalse(context.childAt(0).hasClass(`icon-${icon}`));
    assert.equal(context.childAt(0).props().style.backgroundImage, "url('icon-url')");

    assert.isTrue(context.childAt(1).hasClass("card-context-label"));
    assert.equal(context.childAt(1).text(), linkWithCustomContext.context);
  });
  it("should have .active class, on card-outer if context menu is open", () => {
    const button = wrapper.find(".context-menu-button");
    assert.isFalse(wrapper.find(".card-outer").hasClass("active"));
    button.simulate("click", {preventDefault: () => {}});
    assert.isTrue(wrapper.find(".card-outer").hasClass("active"));
  });
  it("should have a loaded preview image when the image is loaded", () => {
    assert.isFalse(wrapper.find(".card-preview-image").hasClass("loaded"));

    wrapper.setState({imageLoaded: true});

    assert.isTrue(wrapper.find(".card-preview-image").hasClass("loaded"));
  });
  describe("image loading", () => {
    let link;
    let triggerImage = {};
    let uniqueLink = 0;
    beforeEach(() => {
      global.Image.prototype = {
        addEventListener(event, callback) {
          triggerImage[event] = () => Promise.resolve(callback());
        }
      };

      link = Object.assign({}, DEFAULT_PROPS.link);
      link.image += uniqueLink++;
      wrapper = mountWithIntl(<Card {...Object.assign({}, DEFAULT_PROPS, {link})} />);
    });
    it("should start not loaded", () => {
      assert.isFalse(wrapper.state("imageLoaded"));
    });
    it("should be loaded after load", async () => {
      await triggerImage.load();

      assert.isTrue(wrapper.state("imageLoaded"));
    });
    it("should be not be loaded after error ", async () => {
      await triggerImage.error();

      assert.isFalse(wrapper.state("imageLoaded"));
    });
    it("should be not be loaded if image changes", async () => {
      await triggerImage.load();
      const otherLink = Object.assign({}, link, {image: "https://other/image"});

      wrapper.setProps(Object.assign({}, DEFAULT_PROPS, {link: otherLink}));

      assert.isFalse(wrapper.state("imageLoaded"));
    });
  });
  describe("placeholder=true", () => {
    beforeEach(() => {
      wrapper = mountWithIntl(<Card placeholder={true} />);
    });
    it("should render when placeholder=true", () => {
      assert.ok(wrapper.exists());
    });
    it("should add a placeholder class to the outer element", () => {
      assert.isTrue(wrapper.find(".card-outer").hasClass("placeholder"));
    });
    it("should not have a context menu button or LinkMenu", () => {
      assert.isFalse(wrapper.find(".context-menu-button").exists(), "context menu button");
      assert.isFalse(wrapper.find(LinkMenu).exists(), "LinkMenu");
    });
    it("should not call onLinkClick when the link is clicked", () => {
      const spy = sinon.spy(wrapper.instance(), "onLinkClick");
      const card = wrapper.find(".card");
      card.simulate("click");
      assert.notCalled(spy);
    });
  });

  describe("#trackClick", () => {
    it("should call dispatch when the link is clicked with the right data", () => {
      const card = wrapper.find(".card");
      const event = {altKey: "1", button: "2", ctrlKey: "3", metaKey: "4", shiftKey: "5"};
      card.simulate("click", Object.assign({}, event, {preventDefault: () => {}}));
      assert.calledThrice(DEFAULT_PROPS.dispatch);

      // first dispatch call is the SendToMain message which will open a link in a window, and send some event data
      assert.equal(DEFAULT_PROPS.dispatch.firstCall.args[0].type, at.OPEN_LINK);
      assert.deepEqual(DEFAULT_PROPS.dispatch.firstCall.args[0].data.event, event);

      // second dispatch call is a UserEvent action for telemetry
      assert.isUserEventAction(DEFAULT_PROPS.dispatch.secondCall.args[0]);
      assert.calledWith(DEFAULT_PROPS.dispatch.secondCall, ac.UserEvent({
        event: "CLICK",
        source: DEFAULT_PROPS.eventSource,
        action_position: DEFAULT_PROPS.index
      }));

      // third dispatch call is to send impression stats
      assert.calledWith(DEFAULT_PROPS.dispatch.thirdCall, ac.ImpressionStats({
        source: DEFAULT_PROPS.eventSource,
        click: 0,
        tiles: [{id: DEFAULT_PROPS.link.guid, pos: DEFAULT_PROPS.index}]
      }));
    });
  });
});

describe("<PlaceholderCard />", () => {
  it("should render a Card with placeholder=true", () => {
    const wrapper = shallow(<PlaceholderCard />);
    assert.isTrue(wrapper.find(Card).props().placeholder);
  });
});
