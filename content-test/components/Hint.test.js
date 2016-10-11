const React = require("react");
const TestUtils = require("react-addons-test-utils");
const {renderWithProvider} = require("test/test-utils");
const ConnectedHint = require("components/Hint/Hint");
const {Hint} = ConnectedHint;
const {DisableHint} = require("common/action-manager").actions;

describe("Hint", () => {
  let instance;

  function setup(custom = {}) {
    const props = Object.assign({id: "foo", title: "foo", body: "bar"}, custom);
    instance = TestUtils.renderIntoDocument(<Hint {...props} />);
  }

  beforeEach(setup);

  it("should render the component", () => {
    TestUtils.isCompositeComponentWithType(instance, Hint);
  });

  describe("default state", () => {
    it("should show the container by default", () => {
      assert.equal(instance.refs.container.hidden, false);
    });
    it("should show the prompt by default", () => {
      assert.equal(instance.refs.prompt.hidden, false);
    });
    it("should hide the explanation by default", () => {
      assert.equal(instance.refs.explanation.hidden, true);
    });
  });

  describe("props", () => {
    it("should hide the container if props.disabled is true", () => {
      setup({id: "foo", disabled: true});
      assert.equal(instance.refs.container.hidden, true);
    });
    it("should render props.title", () => {
      setup({id: "foo", title: "Everglade"});
      assert.equal(instance.refs.title.innerHTML, "Everglade");
    });
    it("should render props.body", () => {
      setup({id: "foo", body: "Bloop"});
      assert.equal(instance.refs.body.innerHTML, "Bloop");
    });
  });

  describe("state", () => {
    it("should show the explanation if state.active is true", () => {
      instance.setState({active: true});
      assert.equal(instance.refs.explanation.hidden, false);
    });
    it("should hide the explanation if state.active is false", () => {
      instance.setState({active: false});
      assert.equal(instance.refs.explanation.hidden, true);
    });
    it("should set state.active = true if the prompt is clicked", () => {
      assert.equal(instance.state.active, false);
      TestUtils.Simulate.click(instance.refs.prompt);
      assert.equal(instance.state.active, true);
    });
  });

  describe("disable button", () => {
    let dispatch;
    beforeEach(() => {
      dispatch = sinon.spy();
      setup({id: "foo", dispatch});
      instance.setState({active: true});
    });
    it("should set active = false if the close button is clicked", () => {
      TestUtils.Simulate.click(instance.refs.closeButton);
      assert.equal(instance.state.active, false);
    });
    it("should dispatch a disable action if the close button is clicked", () => {
      TestUtils.Simulate.click(instance.refs.closeButton);
      assert.calledWith(dispatch, DisableHint("foo"));
    });
  });

  describe("connected state", () => {
    it("should set props.disabled to false if Hints[props.id] is undefined", () => {
      const connected = renderWithProvider(<ConnectedHint id="foo" title="foo" body="blah" />, {getState: () => ({Hints: {}})});
      instance = TestUtils.findRenderedComponentWithType(connected, Hint);
      assert.equal(instance.props.disabled, false);
    });
    it("should set props.disabled to true if Hints[props.id] is false", () => {
      const connected = renderWithProvider(<ConnectedHint id="foo" title="foo" body="blah" />, {getState: () => ({Hints: {foo: false}})});
      instance = TestUtils.findRenderedComponentWithType(connected, Hint);
      assert.equal(instance.props.disabled, true);
    });
  });

  describe("window listeners", () => {
    let clock;
    beforeEach(() => {
      sinon.spy(window, "addEventListener");
      sinon.spy(window, "removeEventListener");
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      window.addEventListener.restore();
      window.removeEventListener.restore();
      clock.restore();
    });
    it("should set active = false when this.hide is called", () => {
      instance.setState({active: true});
      instance.hide();
      assert.equal(instance.state.active, false);
    });
    it("should attach a window listener when active is set to true", () => {
      instance.setState({active: true});
      instance.setState({foo: true});
      clock.tick(1);
      assert.calledOnce(window.addEventListener);
      assert.calledWithExactly(window.addEventListener, "click", instance.hide, false);
    });
    it("should remove window listener when active is set to false", () => {
      instance.setState({active: true});
      instance.setState({foo: true});
      instance.setState({active: false});
      assert.calledOnce(window.removeEventListener);
      assert.calledWithExactly(window.removeEventListener, "click", instance.hide);
    });
    it("should remove window listener when component is unmounted", () => {
      instance.setState({active: true});
      instance.componentWillUnmount();
      assert.calledOnce(window.removeEventListener);
      assert.calledWithExactly(window.removeEventListener, "click", instance.hide);
    });
  });
});
