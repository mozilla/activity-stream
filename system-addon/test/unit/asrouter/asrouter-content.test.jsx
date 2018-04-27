import {ASRouterUISurface, ASRouterUtils} from "content-src/asrouter/asrouter-content";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import {GlobalOverrider} from "test/unit/utils";
import {ImpressionsWrapper} from "content-src/components/Sections/ImpressionsWrapper";
import React from "react";
import {shallow} from "enzyme";

describe("ASRouterUtils", () => {
  let global;
  let sandbox;
  let fakeSendAsyncMessage;
  beforeEach(() => {
    global = new GlobalOverrider();
    sandbox = sinon.sandbox.create();
    fakeSendAsyncMessage = sandbox.stub();
    global.set({sendAsyncMessage: fakeSendAsyncMessage});
  });
  afterEach(() => {
    sandbox.restore();
    global.restore();
  });
  it("should send a message with the message payload", () => {
    ASRouterUtils.sendImpressionStats({id: 1, campaign: "foo", template: "simple"});

    assert.calledOnce(fakeSendAsyncMessage);
    assert.calledWith(fakeSendAsyncMessage, AS_GENERAL_OUTGOING_MESSAGE_NAME);
    const [, payload] = fakeSendAsyncMessage.firstCall.args;
    assert.propertyVal(payload.data, "id", 1);
    assert.propertyVal(payload.data, "campaign", "foo");
    assert.propertyVal(payload.data, "template", "simple");
  });
});

describe("ASRouterUISurface", () => {
  let wrapper;
  let fakeAddMessageListener;
  let fakeSendAsyncMessage;
  let global;
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeAddMessageListener = sandbox.stub();
    fakeSendAsyncMessage = sandbox.stub();

    global = new GlobalOverrider();
    global.set({
      addMessageListener: fakeAddMessageListener,
      sendAsyncMessage: fakeSendAsyncMessage
    });
    wrapper = shallow(<ASRouterUISurface />);
  });
  afterEach(() => {
    sandbox.restore();
    global.restore();
  });

  it("should render the component if a message id is defined", () => {
    wrapper.setState({message: {id: 1}});

    assert.isTrue(wrapper.exists());
  });

  it("should be wrapped in a ImpressionsWrapper", () => {
    wrapper.setState({message: {id: 1}});

    assert.isTrue(wrapper.find(ImpressionsWrapper).exists());
  });

  it("should provide correct props to ImpressionsWrapper", () => {
    wrapper.setState({message: {id: 1}});
    const props = wrapper.find(ImpressionsWrapper).props();

    assert.propertyVal(props, "sendOnMount", true);
    assert.propertyVal(props, "shouldSendImpressionsOnUpdate", wrapper.instance().shouldSendImpressionsOnUpdate);
    assert.propertyVal(props, "dispatchImpressionStats", wrapper.instance().dispatchImpressionStats);
  });

  it("should call ASRouterUtils.sendImpressionStats", () => {
    const message = {id: 1};
    wrapper.setState({message});
    sandbox.stub(ASRouterUtils, "sendImpressionStats");

    wrapper.instance().dispatchImpressionStats();

    assert.calledOnce(ASRouterUtils.sendImpressionStats);
    assert.calledWithExactly(ASRouterUtils.sendImpressionStats, message);
  });

  it("should return true only when we switch to a different message", () => {
    const messageA = {message: {id: 1}};
    const messageB = {message: {id: 2}};
    let prevState = wrapper.state();
    wrapper.setState(messageA);

    // We went from no message to a message.
    assert.isTrue(wrapper.instance().shouldSendImpressionsOnUpdate(prevState));

    prevState = wrapper.state();
    wrapper.setState(messageB);

    // From messageA to messageB
    assert.isTrue(wrapper.instance().shouldSendImpressionsOnUpdate(prevState));

    prevState = wrapper.state();
    wrapper.setState(messageB);

    // From messageB to messageB no change
    assert.isFalse(wrapper.instance().shouldSendImpressionsOnUpdate(prevState));

    wrapper.setState({});

    // From messageB to no message
    assert.isFalse(wrapper.instance().shouldSendImpressionsOnUpdate(prevState));
  });
});
