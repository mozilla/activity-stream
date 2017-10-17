const {ActivityStreamMessageChannel, DEFAULT_OPTIONS} = require("lib/ActivityStreamMessageChannel.jsm");
const {addNumberReducer, GlobalOverrider} = require("test/unit/utils");
const {createStore, applyMiddleware} = require("redux");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

const OPTIONS = ["pageURL, outgoingMessageName", "incomingMessageName", "dispatch"];

describe("ActivityStreamMessageChannel", () => {
  let globals;
  let dispatch;
  let mm;
  let RPmessagePorts;
  beforeEach(() => {
    RPmessagePorts = [];
    function RP(url, isFromAboutNewTab = false) {
      this.url = url;
      this.messagePorts = RPmessagePorts;
      this.addMessageListener = globals.sandbox.spy();
      this.removeMessageListener = globals.sandbox.spy();
      this.sendAsyncMessage = globals.sandbox.spy();
      this.destroy = globals.sandbox.spy();
      this.isFromAboutNewTab = isFromAboutNewTab;
    }
    globals = new GlobalOverrider();
    const override = globals.sandbox.stub();
    override.withArgs(true).returns(new RP("about:newtab", true));
    override.withArgs(false).returns(null);
    globals.set("AboutNewTab", {
      override,
      reset: globals.sandbox.spy()
    });
    globals.set("RemotePages", RP);
    dispatch = globals.sandbox.spy();
    mm = new ActivityStreamMessageChannel({dispatch});
  });

  afterEach(() => globals.restore());

  it("should exist", () => {
    assert.ok(ActivityStreamMessageChannel);
  });
  it("should apply default options", () => {
    mm = new ActivityStreamMessageChannel();
    OPTIONS.forEach(o => assert.equal(mm[o], DEFAULT_OPTIONS[o], o));
  });
  it("should add options", () => {
    const options = {dispatch: () => {}, pageURL: "FOO.html", outgoingMessageName: "OUT", incomingMessageName: "IN"};
    mm = new ActivityStreamMessageChannel(options);
    OPTIONS.forEach(o => assert.equal(mm[o], options[o], o));
  });
  it("should throw an error if no dispatcher was provided", () => {
    mm = new ActivityStreamMessageChannel();
    assert.throws(() => mm.dispatch({type: "FOO"}));
  });
  describe("Creating/destroying the channel", () => {
    describe("#createChannel", () => {
      it("should create .channel with the correct URL", () => {
        mm.createChannel();
        assert.ok(mm.channel);
        assert.equal(mm.channel.url, mm.pageURL);
      });
      it("should add 4 message listeners", () => {
        mm.createChannel();
        assert.callCount(mm.channel.addMessageListener, 4);
      });
      it("should add the custom message listener to the channel", () => {
        mm.createChannel();
        assert.calledWith(mm.channel.addMessageListener, mm.incomingMessageName, mm.onMessage);
      });
      it("should override AboutNewTab", () => {
        mm.createChannel();
        assert.calledOnce(global.AboutNewTab.override);
      });
      it("should use the channel passed by AboutNewTab on override", () => {
        mm.createChannel();
        assert.ok(mm.channel.isFromAboutNewTab);
      });
      it("should not override AboutNewTab if the pageURL is not about:newtab", () => {
        mm = new ActivityStreamMessageChannel({pageURL: "foo.html"});
        mm.createChannel();
        assert.notCalled(global.AboutNewTab.override);
      });
    });
    describe("#simulateMessagesForExistingTabs", () => {
      beforeEach(() => {
        sinon.stub(mm, "onActionFromContent");
        mm.createChannel();
      });
      it("should simulate init for existing ports", () => {
        RPmessagePorts.push({
          url: "about:monkeys",
          loaded: false,
          portID: "inited"
        });
        RPmessagePorts.push({
          url: "about:sheep",
          loaded: true,
          portID: "loaded"
        });

        mm.simulateMessagesForExistingTabs();

        assert.calledWith(mm.onActionFromContent.firstCall, {type: at.NEW_TAB_INIT, data: RPmessagePorts[0]});
        assert.calledWith(mm.onActionFromContent.secondCall, {type: at.NEW_TAB_INIT, data: RPmessagePorts[1]});
      });
      it("should simluate load for loaded ports", () => {
        RPmessagePorts.push({loaded: true, portID: "foo"});

        mm.simulateMessagesForExistingTabs();

        assert.calledWith(mm.onActionFromContent, {type: at.NEW_TAB_LOAD}, "foo");
      });
    });
    describe("#destroyChannel", () => {
      let channel;
      beforeEach(() => {
        mm.createChannel();
        channel = mm.channel;
      });
      it("should set .channel to null", () => {
        mm.destroyChannel();
        assert.isNull(mm.channel);
      });
      it("should reset AboutNewTab, and pass back its channel", () => {
        mm.destroyChannel();
        assert.calledOnce(global.AboutNewTab.reset);
        assert.calledWith(global.AboutNewTab.reset, channel);
      });
      it("should not reset AboutNewTab if the pageURL is not about:newtab", () => {
        mm = new ActivityStreamMessageChannel({pageURL: "foo.html"});
        mm.createChannel();
        mm.destroyChannel();
        assert.notCalled(global.AboutNewTab.reset);
      });
      it("should call channel.destroy() if pageURL is not about:newtab", () => {
        mm = new ActivityStreamMessageChannel({pageURL: "foo.html"});
        mm.createChannel();
        channel = mm.channel;
        mm.destroyChannel();
        assert.calledOnce(channel.destroy);
      });
    });
  });
  describe("Message handling", () => {
    describe("#getTargetById", () => {
      it("should get an id if it exists", () => {
        const t = {portID: "foo"};
        mm.createChannel();
        mm.channel.messagePorts.push(t);
        assert.equal(mm.getTargetById("foo"), t);
      });
      it("should return null if the target doesn't exist", () => {
        const t = {portID: "foo"};
        mm.createChannel();
        mm.channel.messagePorts.push(t);
        assert.equal(mm.getTargetById("bar"), null);
      });
    });
    describe("#onNewTabInit", () => {
      it("should dispatch a NEW_TAB_INIT action", () => {
        const t = {portID: "foo", url: "about:monkeys"};
        sinon.stub(mm, "onActionFromContent");

        mm.onNewTabInit({target: t});

        assert.calledWith(mm.onActionFromContent, {
          type: at.NEW_TAB_INIT,
          data: t
        });
      });
    });
    describe("#onNewTabLoad", () => {
      it("should dispatch a NEW_TAB_LOAD action", () => {
        const t = {portID: "foo"};
        sinon.stub(mm, "onActionFromContent");
        mm.onNewTabLoad({target: t});
        assert.calledWith(mm.onActionFromContent, {type: at.NEW_TAB_LOAD}, "foo");
      });
    });
    describe("#onNewTabUnload", () => {
      it("should dispatch a NEW_TAB_UNLOAD action", () => {
        const t = {portID: "foo"};
        sinon.stub(mm, "onActionFromContent");
        mm.onNewTabUnload({target: t});
        assert.calledWith(mm.onActionFromContent, {type: at.NEW_TAB_UNLOAD}, "foo");
      });
    });
    describe("#onMessage", () => {
      let sandbox;
      beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.spy(global.Components.utils, "reportError");
      });
      afterEach(() => sandbox.restore());
      it("should report an error if the msg.data is missing", () => {
        mm.onMessage({target: {portID: "foo"}});
        assert.calledOnce(global.Components.utils.reportError);
      });
      it("should report an error if the msg.data.type is missing", () => {
        mm.onMessage({target: {portID: "foo"}, data: "foo"});
        assert.calledOnce(global.Components.utils.reportError);
      });
      it("should call onActionFromContent", () => {
        sinon.stub(mm, "onActionFromContent");
        const action = {data: {data: {}, type: "FOO"}, target: {portID: "foo"}};
        const expectedAction = {
          type: action.data.type,
          data: action.data.data,
          _target: {portID: "foo"}
        };
        mm.onMessage(action);
        assert.calledWith(mm.onActionFromContent, expectedAction, "foo");
      });
    });
  });
  describe("Sending and broadcasting", () => {
    describe("#send", () => {
      it("should send a message on the right port", () => {
        const t = {portID: "foo", sendAsyncMessage: sinon.spy()};
        mm.createChannel();
        mm.channel.messagePorts = [t];
        const action = ac.SendToContent({type: "HELLO"}, "foo");
        mm.send(action, "foo");
        assert.calledWith(t.sendAsyncMessage, DEFAULT_OPTIONS.outgoingMessageName, action);
      });
      it("should not throw if the target isn't around", () => {
        mm.createChannel();
        // port is not added to the channel
        const action = ac.SendToContent({type: "HELLO"}, "foo");

        assert.doesNotThrow(() => mm.send(action, "foo"));
      });
    });
    describe("#broadcast", () => {
      it("should send a message on the channel", () => {
        mm.createChannel();
        const action = ac.BroadcastToContent({type: "HELLO"});
        mm.broadcast(action);
        assert.calledWith(mm.channel.sendAsyncMessage, DEFAULT_OPTIONS.outgoingMessageName, action);
      });
    });
  });
  describe("Handling actions", () => {
    describe("#onActionFromContent", () => {
      beforeEach(() => mm.onActionFromContent({type: "FOO"}, "foo"));
      it("should dispatch a SendToMain action", () => {
        assert.calledOnce(dispatch);
        const action = dispatch.firstCall.args[0];
        assert.equal(action.type, "FOO", "action.type");
      });
      it("should have the right fromTarget", () => {
        const action = dispatch.firstCall.args[0];
        assert.equal(action.meta.fromTarget, "foo", "meta.fromTarget");
      });
    });
    describe("#middleware", () => {
      let store;
      beforeEach(() => {
        store = createStore(addNumberReducer, applyMiddleware(mm.middleware));
      });
      it("should just call next if no channel is found", () => {
        store.dispatch({type: "ADD", data: 10});
        assert.equal(store.getState(), 10);
      });
      it("should not call next if skipMain is true", () => {
        store.dispatch({type: "ADD", data: 10, meta: {skipMain: true}});
        assert.equal(store.getState(), 0);

        sinon.stub(mm, "send");
        const action = ac.SendToContent({type: "ADD", data: 10, meta: {skipMain: true}}, "foo");
        mm.createChannel();
        store.dispatch(action);
        assert.calledWith(mm.send, action);
        assert.equal(store.getState(), 0);
      });
      it("should call .send if the action is SendToContent", () => {
        sinon.stub(mm, "send");
        const action = ac.SendToContent({type: "FOO"}, "foo");

        mm.createChannel();
        store.dispatch(action);

        assert.calledWith(mm.send, action);
      });
      it("should call .broadcast if the action is BroadcastToContent", () => {
        sinon.stub(mm, "broadcast");
        const action = ac.BroadcastToContent({type: "FOO"});

        mm.createChannel();
        store.dispatch(action);

        assert.calledWith(mm.broadcast, action);
      });
      it("should dispatch other actions normally", () => {
        sinon.stub(mm, "send");
        sinon.stub(mm, "broadcast");

        mm.createChannel();
        store.dispatch({type: "ADD", data: 1});

        assert.equal(store.getState(), 1);
        assert.notCalled(mm.send);
        assert.notCalled(mm.broadcast);
      });
    });
  });
});
