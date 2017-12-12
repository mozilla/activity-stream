import {_Base as Base} from "content-src/components/Base/Base";
import React from "react";
import {shallow} from "enzyme";

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
