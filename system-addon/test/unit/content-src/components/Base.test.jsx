const React = require("react");
const {shallow} = require("enzyme");
const {_unconnected: Base} = require("content-src/components/Base/Base");

describe("<Base>", () => {
  let DEFAULT_PROPS = {store: {getState: () => {}}, App: {initialized: true}, Prefs: {values: {}}, dispatch: () => {}};

  it("should render Base component", () => {
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
  });

  it("should fire NEW_TAB_REHYDRATED event", () => {
    const dispatch = sinon.spy();
    shallow(<Base {...Object.assign({}, DEFAULT_PROPS, {dispatch})} />);
    assert.calledOnce(dispatch);
    const action = dispatch.firstCall.args[0];
    assert.equal("NEW_TAB_REHYDRATED", action.type);
  });
});
