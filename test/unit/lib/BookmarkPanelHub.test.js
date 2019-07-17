import { _BookmarkPanelHub } from "lib/BookmarkPanelHub.jsm";
import { GlobalOverrider } from "test/unit/utils";
import { PanelTestProvider } from "lib/PanelTestProvider.jsm";

describe("BookmarkPanelHub", () => {
  let globals;
  let sandbox;
  let instance;
  let fakeAddImpression;
  let fakeHandleMessageRequest;
  let fakeL10n;
  let fakeMessage;
  let fakeMessageFluent;
  let fakeTarget;
  let fakeContainer;
  let fakeDispatch;
  let fakeWindow;
  let isBrowserPrivateStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    globals = new GlobalOverrider();

    fakeL10n = {
      setAttributes: sandbox.stub(),
      translateElements: sandbox.stub().resolves(),
    };
    globals.set("DOMLocalization", function() {
      return fakeL10n;
    }); // eslint-disable-line prefer-arrow-callback
    globals.set("FxAccounts", {
      config: { promiseEmailFirstURI: sandbox.stub() },
    });
    isBrowserPrivateStub = sandbox.stub().returns(false);
    globals.set("PrivateBrowsingUtils", {
      isBrowserPrivate: isBrowserPrivateStub,
    });

    instance = new _BookmarkPanelHub();
    fakeAddImpression = sandbox.stub();
    fakeHandleMessageRequest = sandbox.stub();
    [
      { content: fakeMessageFluent },
      { content: fakeMessage },
    ] = PanelTestProvider.getMessages();
    fakeContainer = {
      addEventListener: sandbox.stub(),
      setAttribute: sandbox.stub(),
      removeAttribute: sandbox.stub(),
      classList: { add: sandbox.stub() },
      appendChild: sandbox.stub(),
      querySelector: sandbox.stub(),
      remove: sandbox.stub(),
      children: [],
      style: {},
      getBoundingClientRect: sandbox.stub(),
    };
    const document = {
      createElementNS: sandbox.stub().returns(fakeContainer),
      getElementById: sandbox.stub().returns(fakeContainer),
      l10n: fakeL10n,
    };
    fakeWindow = {
      ownerGlobal: {
        openLinkIn: sandbox.stub(),
        gBrowser: { selectedBrowser: "browser" },
      },
      MozXULElement: { insertFTLIfNeeded: sandbox.stub() },
      document,
      requestAnimationFrame: x => x(),
    };
    fakeTarget = {
      document,
      container: {
        querySelector: sandbox.stub(),
        appendChild: sandbox.stub(),
        setAttribute: sandbox.stub(),
        removeAttribute: sandbox.stub(),
      },
      hidePopup: sandbox.stub(),
      infoButton: {},
      close: sandbox.stub(),
      browser: {
        ownerGlobal: {
          gBrowser: { ownerDocument: document },
          window: fakeWindow,
        },
      },
    };
    fakeDispatch = sandbox.stub();
  });
  afterEach(() => {
    instance.uninit();
    sandbox.restore();
    globals.restore();
  });
  it("should create an instance", () => {
    assert.ok(instance);
  });
  it("should uninit", () => {
    instance.uninit();

    assert.isFalse(instance._initialized);
    assert.isNull(instance._addImpression);
    assert.isNull(instance._handleMessageRequest);
  });
  it("should instantiate handleMessageRequest and addImpression and l10n", () => {
    instance.init(fakeHandleMessageRequest, fakeAddImpression, fakeDispatch);

    assert.equal(instance._addImpression, fakeAddImpression);
    assert.equal(instance._handleMessageRequest, fakeHandleMessageRequest);
    assert.equal(instance._dispatch, fakeDispatch);
    assert.isTrue(instance._initialized);
  });
  it("should return early if not initialized", async () => {
    assert.isFalse(await instance.messageRequest());
  });
  describe("#messageRequest", () => {
    beforeEach(() => {
      sandbox.stub(instance, "onResponse");
      instance.init(fakeHandleMessageRequest, fakeAddImpression, fakeDispatch);
    });
    afterEach(() => {
      sandbox.restore();
    });
    it("should not re-request messages for the same URL", async () => {
      instance._state = { url: "foo.com", message: { content: true } };
      fakeTarget.url = "foo.com";
      sandbox.stub(instance, "showMessage");

      await instance.messageRequest(fakeTarget);

      assert.notCalled(fakeHandleMessageRequest);
      assert.calledOnce(instance.showMessage);
    });
    it("should call handleMessageRequest", async () => {
      fakeHandleMessageRequest.resolves(fakeMessage);

      await instance.messageRequest(fakeTarget, fakeWindow);

      assert.calledOnce(fakeHandleMessageRequest);
      assert.calledWithExactly(fakeHandleMessageRequest, {
        triggerId: instance._trigger.id,
      });
    });
    it("should call onResponse", async () => {
      fakeHandleMessageRequest.resolves(fakeMessage);

      await instance.messageRequest(fakeTarget, fakeWindow);

      assert.calledOnce(instance.onResponse);
      assert.calledWithExactly(
        instance.onResponse,
        fakeTarget,
        fakeWindow,
        fakeMessage
      );
    });
  });
  describe("#onResponse", () => {
    beforeEach(() => {
      instance.init(fakeHandleMessageRequest, fakeAddImpression, fakeDispatch);
      sandbox.stub(instance, "showMessage");
      sandbox.stub(instance, "sendImpression");
      sandbox.stub(instance, "removeMessage");
      fakeTarget = { infoButton: { disabled: true } };
    });
    it("should show a message when called with a response", () => {
      instance.onResponse(fakeTarget, fakeWindow, { content: "content" });

      assert.calledOnce(instance.showMessage);
      assert.calledWithExactly(
        instance.showMessage,
        fakeTarget,
        fakeWindow,
        "content"
      );
      assert.calledOnce(instance.sendImpression);
    });
    it("should insert the appropriate ftl files with translations", () => {
      instance.onResponse(fakeTarget, fakeWindow, { content: "content" });

      assert.calledTwice(fakeWindow.MozXULElement.insertFTLIfNeeded);
      assert.calledWith(
        fakeWindow.MozXULElement.insertFTLIfNeeded,
        "browser/newtab/asrouter.ftl"
      );
      assert.calledWith(
        fakeWindow.MozXULElement.insertFTLIfNeeded,
        "browser/branding/sync-brand.ftl"
      );
    });
    it("should dispatch a user impression", () => {
      sandbox.spy(instance, "sendUserEventTelemetry");

      instance.onResponse(fakeTarget, fakeWindow, { content: "content" });

      assert.calledOnce(instance.sendUserEventTelemetry);
      assert.calledWithExactly(
        instance.sendUserEventTelemetry,
        "IMPRESSION",
        fakeWindow
      );
      assert.calledOnce(fakeDispatch);

      const [ping] = fakeDispatch.firstCall.args;

      assert.equal(ping.type, "DOORHANGER_TELEMETRY");
      assert.equal(ping.data.event, "IMPRESSION");
    });
    it("should not dispatch a user impression if the window is private", () => {
      isBrowserPrivateStub.returns(true);
      sandbox.spy(instance, "sendUserEventTelemetry");

      instance.onResponse(fakeTarget, fakeWindow, { content: "content" });

      assert.calledOnce(instance.sendUserEventTelemetry);
      assert.calledWithExactly(
        instance.sendUserEventTelemetry,
        "IMPRESSION",
        fakeWindow
      );
      assert.notCalled(fakeDispatch);
    });
    it("should hide existing messages if no response is provided", () => {
      instance.onResponse(fakeTarget, fakeWindow, null);

      assert.calledOnce(instance.removeMessage);
      assert.calledWithExactly(instance.removeMessage, fakeTarget, fakeWindow);
    });
  });
  describe("#showMessage.collapsed=false", () => {
    beforeEach(() => {
      instance.init(fakeHandleMessageRequest, fakeAddImpression, fakeDispatch);
      sandbox.stub(instance, "toggleRecommendation");
      sandbox
        .stub(instance, "_state")
        .value({ collapsed: false, message: fakeMessage });
    });
    it("should create a container", () => {
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);

      assert.equal(fakeTarget.document.createElementNS.callCount, 6);
      assert.calledOnce(fakeTarget.container.appendChild);
      assert.notCalled(fakeL10n.setAttributes);
    });
    it("should create a container (fluent message)", () => {
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessageFluent);

      assert.equal(fakeTarget.document.createElementNS.callCount, 6);
      assert.calledOnce(fakeTarget.container.appendChild);
    });
    it("should set l10n attributes", () => {
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessageFluent);

      assert.equal(fakeL10n.setAttributes.callCount, 4);
    });
    it("call adjust panel height when height is > 150px", async () => {
      fakeTarget.container.querySelector.returns(false);
      fakeContainer.getBoundingClientRect.returns({ height: 160 });

      await instance._adjustPanelHeight(fakeWindow, fakeContainer);

      assert.calledOnce(fakeWindow.document.l10n.translateElements);
      assert.calledTwice(fakeContainer.getBoundingClientRect);
      assert.calledWithExactly(
        fakeContainer.classList.add,
        "longMessagePadding"
      );
    });
    it("should reuse the container", () => {
      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);

      assert.notCalled(fakeTarget.container.appendChild);
    });
    it("should open a tab with FxA signup", async () => {
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);
      // Call the event listener cb
      await fakeContainer.addEventListener.firstCall.args[1]();

      assert.calledOnce(fakeWindow.ownerGlobal.openLinkIn);
    });
    it("should send a click event", async () => {
      sandbox.stub(instance, "sendUserEventTelemetry");
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);
      // Call the event listener cb
      await fakeContainer.addEventListener.firstCall.args[1]();

      assert.calledOnce(instance.sendUserEventTelemetry);
      assert.calledWithExactly(
        instance.sendUserEventTelemetry,
        "CLICK",
        fakeWindow
      );
    });
    it("should send a click event", async () => {
      sandbox.stub(instance, "sendUserEventTelemetry");
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);
      // Call the event listener cb
      await fakeContainer.addEventListener.firstCall.args[1]();

      assert.calledOnce(instance.sendUserEventTelemetry);
      assert.calledWithExactly(
        instance.sendUserEventTelemetry,
        "CLICK",
        fakeWindow
      );
    });
    it("should collapse the message", () => {
      sandbox.spy(instance, "collapseMessage");
      instance._state.collapsed = false;
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);
      // Show message calls it once so we need to reset
      instance.toggleRecommendation.reset();
      // Call the event listener cb
      fakeContainer.addEventListener.secondCall.args[1]();

      assert.calledOnce(instance.collapseMessage);
      assert.calledOnce(fakeTarget.close);
      assert.isTrue(instance._state.collapsed);
      assert.calledOnce(instance.toggleRecommendation);
    });
    it("should send a dismiss event", () => {
      sandbox.stub(instance, "sendUserEventTelemetry");
      sandbox.spy(instance, "collapseMessage");
      instance._state.collapsed = false;
      fakeWindow.document.getElementById.returns(null);

      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);
      // Call the event listener cb
      fakeContainer.addEventListener.secondCall.args[1]();

      assert.calledOnce(instance.sendUserEventTelemetry);
      assert.calledWithExactly(
        instance.sendUserEventTelemetry,
        "DISMISS",
        fakeWindow
      );
    });
    it("should call toggleRecommendation `true`", () => {
      instance.showMessage(fakeTarget, fakeWindow, fakeMessage);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(instance.toggleRecommendation, fakeTarget, true);
    });
  });
  describe("#showMessage.collapsed=true", () => {
    beforeEach(() => {
      instance.init({});
      instance._state.collapsed = true;
      sandbox.stub(instance, "toggleRecommendation");
    });
    it("should return early if the message is collapsed", () => {
      instance.showMessage(fakeTarget, fakeWindow);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(
        instance.toggleRecommendation,
        fakeTarget,
        false
      );
    });
  });
  describe("#removeMessage", () => {
    beforeEach(() => {
      sandbox.stub(instance, "toggleRecommendation");
    });
    it("should remove the message", () => {
      instance.removeMessage(fakeTarget, fakeWindow);

      assert.calledOnce(fakeContainer.remove);
    });
    it("should call toggleRecommendation `false`", () => {
      instance.removeMessage(fakeTarget, fakeWindow);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(
        instance.toggleRecommendation,
        fakeTarget,
        false
      );
    });
  });
  describe("#toggleRecommendation", () => {
    beforeEach(() => {
      instance._state = {};
    });
    it("should check infoButton", () => {
      instance.toggleRecommendation(fakeTarget, true);

      assert.isTrue(fakeTarget.infoButton.checked);
    });
    it("should uncheck infoButton", () => {
      instance.toggleRecommendation(fakeTarget, false);

      assert.isFalse(fakeTarget.infoButton.checked);
    });
    it("should uncheck infoButton", () => {
      fakeTarget.infoButton.checked = true;

      instance.toggleRecommendation(fakeTarget);

      assert.isFalse(fakeTarget.infoButton.checked);
    });
    it("should disable the container", () => {
      fakeTarget.infoButton.checked = true;

      instance.toggleRecommendation(fakeTarget);

      assert.calledOnce(fakeTarget.container.setAttribute);
    });
    it("should enable container", () => {
      fakeTarget.infoButton.checked = false;

      instance.toggleRecommendation(fakeTarget);

      assert.calledOnce(fakeTarget.container.removeAttribute);
      assert.isFalse(instance._state.collapsed);
    });
  });
  describe("#_forceShowMessage", () => {
    it("should call showMessage with the correct args", () => {
      sandbox.spy(instance, "showMessage");
      sandbox.stub(instance, "removeMessage");

      instance._forceShowMessage(fakeTarget, { content: fakeMessage });

      assert.calledOnce(instance.showMessage);
      assert.calledOnce(instance.removeMessage);
      assert.calledWithExactly(
        instance.showMessage,
        sinon.match.object,
        fakeWindow,
        fakeMessage
      );
    });
    it("should insert required fluent files", () => {
      sandbox.stub(instance, "showMessage");

      instance._forceShowMessage(fakeTarget, { content: fakeMessage });

      assert.calledTwice(fakeWindow.MozXULElement.insertFTLIfNeeded);
    });
    it("should insert a message you can collapse", () => {
      sandbox.spy(instance, "showMessage");
      sandbox.stub(instance, "toggleRecommendation");
      sandbox.stub(instance, "sendUserEventTelemetry");
      // Force rendering the message
      fakeWindow.document.getElementById
        .returns(null)
        .withArgs("editBookmarkPanelRecommendation")
        .returns(fakeContainer);

      instance._forceShowMessage(fakeTarget, { content: fakeMessage });

      assert.calledTwice(fakeContainer.addEventListener);

      const [target] = instance.showMessage.firstCall.args;
      const [
        ,
        eventListenerCb,
      ] = fakeContainer.addEventListener.secondCall.args;
      // Called with `true` to show the message
      instance.toggleRecommendation.reset();
      eventListenerCb({ stopPropagation: sandbox.stub() });

      assert.calledWithExactly(instance.toggleRecommendation, target, false);
    });
  });
  describe("#sendImpression", () => {
    beforeEach(() => {
      instance.init(fakeHandleMessageRequest, fakeAddImpression, fakeDispatch);
      instance._state = { message: "foo" };
    });
    it("should dispatch an impression", () => {
      instance.sendImpression();

      assert.calledOnce(fakeAddImpression);
      assert.equal(fakeAddImpression.firstCall.args[0], "foo");
    });
  });
});
