const React = require("react");
const {GlobalOverrider, mountWithIntl, shallowWithIntl} = require("test/unit/utils");
const {_unconnected: Search} = require("content-src/components/Search/Search");

const DEFAULT_PROPS = {dispatch() {}};

describe("<Search>", () => {
  let globals;
  let sandbox;
  beforeEach(() => {
    globals = new GlobalOverrider();
    sandbox = globals.sandbox;

    global.ContentSearchUIController.prototype = {search: sandbox.spy()};
  });
  afterEach(() => {
    globals.restore();
  });

  it("should render a Search element", () => {
    const wrapper = shallowWithIntl(<Search {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });
  it("should not use a <form> element", () => {
    const wrapper = mountWithIntl(<Search {...DEFAULT_PROPS} />);

    assert.equal(wrapper.find("form").length, 0);
  });
  it("should listen for ContentSearchClient on render", () => {
    const spy = globals.set("addEventListener", sandbox.spy());

    const wrapper = mountWithIntl(<Search {...DEFAULT_PROPS} />);

    assert.calledOnce(spy);
    assert.equal(spy.firstCall.args[0], "ContentSearchClient");
    assert.equal(spy.firstCall.args[1], wrapper.node);
  });
  it("should stop listening for ContentSearchClient on unmount", () => {
    const spy = globals.set("removeEventListener", sandbox.spy());
    const wrapper = mountWithIntl(<Search {...DEFAULT_PROPS} />);

    wrapper.unmount();

    assert.calledOnce(spy);
    assert.equal(spy.firstCall.args[0], "ContentSearchClient");
    assert.equal(spy.firstCall.args[1], wrapper.node);
  });
  it("should add gContentSearchController as a global", () => {
    // current about:home tests need gContentSearchController to exist as a global
    // so let's test it here too to ensure we don't break this behaviour
    mountWithIntl(<Search {...DEFAULT_PROPS} />);
    assert.property(window, "gContentSearchController");
    assert.ok(window.gContentSearchController);
  });
  it("should pass along search when clicking the search button", () => {
    const wrapper = mountWithIntl(<Search {...DEFAULT_PROPS} />);

    wrapper.find(".search-button").simulate("click");

    const {search} = window.gContentSearchController;
    assert.calledOnce(search);
    assert.propertyVal(search.firstCall.args[0], "type", "click");
  });
  it("should send a UserEvent action", () => {
    global.ContentSearchUIController.prototype.search = () => {
      dispatchEvent(new CustomEvent("ContentSearchClient", {detail: {type: "Search"}}));
    };
    const dispatch = sinon.spy();
    const wrapper = mountWithIntl(<Search {...DEFAULT_PROPS} dispatch={dispatch} />);

    wrapper.find(".search-button").simulate("click");

    assert.calledOnce(dispatch);
    const action = dispatch.firstCall.args[0];
    assert.isUserEventAction(action);
    assert.propertyVal(action.data, "event", "SEARCH");
  });
});
