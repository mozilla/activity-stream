import {_BookmarkPanelHub} from "lib/BookmarkPanelHub.jsm";
import {GlobalOverrider} from "test/unit/utils";

describe("BookmarkPanelHub", () => {
  let globals;
  let sandbox;
  let instance;
  let fakeAddImpression;
  let fakeHandleMessageRequest;
  let fakeL10n;
  let fakeMessage;
  let fakeTarget;
  let fakeContainer;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    globals = new GlobalOverrider();

    fakeL10n = {setAttributes: sandbox.stub(), translateElements: sandbox.stub()};
    globals.set("DOMLocalization", function() { return fakeL10n; }); // eslint-disable-line prefer-arrow-callback
    globals.set("FxAccounts", {config: {promiseEmailFirstURI: sandbox.stub()}});

    instance = new _BookmarkPanelHub();
    fakeAddImpression = sandbox.stub();
    fakeHandleMessageRequest = sandbox.stub();
    fakeMessage = {
      text: "text",
      title: "title",
      link: {
        url: "url",
        text: "text",
      },
      color: "white",
      background_color_1: "#7d31ae",
      background_color_2: "#5033be",
      info_icon: {tooltiptext: "cfr-bookmark-tooltip-text"},
      close_button: {tooltiptext: "cfr-bookmark-tooltip-text"},
    };
    fakeContainer = {
      addEventListener: sandbox.stub(),
      setAttribute: sandbox.stub(),
      classList: {add: sandbox.stub()},
      appendChild: sandbox.stub(),
      children: [],
      style: {},
    };
    fakeTarget = {
      document: {
        createElementNS: sandbox.stub().returns(fakeContainer),
      },
      container: {
        querySelector: sandbox.stub(),
        appendChild: sandbox.stub(),
      },
      hidePopup: sandbox.stub(),
      infoButton: {},
      close: sandbox.stub(),
    };
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

    assert.isFalse(instance._initalized);
    assert.isNull(instance._addImpression);
    assert.isNull(instance._handleMessageRequest);
  });
  it("should instantiate handleMessageRequest and addImpression and l10n", () => {
    instance.init(fakeHandleMessageRequest, fakeAddImpression);

    assert.equal(instance._addImpression, fakeAddImpression);
    assert.equal(instance._handleMessageRequest, fakeHandleMessageRequest);
    assert.ok(instance._l10n);
    assert.isTrue(instance._initalized);
  });
  describe("#messageRequest", () => {
    beforeEach(() => {
      sandbox.stub(instance, "onResponse");
      instance.init(fakeHandleMessageRequest, fakeAddImpression);
    });
    afterEach(() => {
      sandbox.restore();
    });
    it("should not re-request messages for the same URL", async () => {
      instance._response = {url: "foo.com", content: true};
      fakeTarget.url = "foo.com";
      sandbox.stub(instance, "showMessage");

      await instance.messageRequest(fakeTarget);

      assert.notCalled(fakeHandleMessageRequest);
      assert.calledOnce(instance.showMessage);
    });
    it("should call handleMessageRequest", async () => {
      fakeHandleMessageRequest.resolves(fakeMessage);

      await instance.messageRequest(fakeTarget, {});

      assert.calledOnce(fakeHandleMessageRequest);
      assert.calledWithExactly(fakeHandleMessageRequest, instance._trigger);
    });
    it("should call onResponse", async () => {
      fakeHandleMessageRequest.resolves(fakeMessage);

      await instance.messageRequest(fakeTarget, {});

      assert.calledOnce(instance.onResponse);
      assert.calledWithExactly(instance.onResponse, fakeMessage, fakeTarget, {});
    });
  });
  describe("#onResponse", () => {
    beforeEach(() => {
      sandbox.stub(instance, "showMessage");
      sandbox.stub(instance, "sendImpression");
      sandbox.stub(instance, "hideMessage");
      fakeTarget = {infoButton: {disabled: true}};
    });
    it("should show a message when called with a response", () => {
      instance.onResponse({content: "content"}, fakeTarget, {});

      assert.calledOnce(instance.showMessage);
      assert.calledWithExactly(instance.showMessage, "content", fakeTarget, {});
      assert.calledOnce(instance.sendImpression);
    });
    it("should hide existing messages if no response is provided", () => {
      instance.onResponse(null, fakeTarget);

      assert.calledOnce(instance.hideMessage);
      assert.calledWithExactly(instance.hideMessage, fakeTarget);
    });
  });
  describe("#showMessage.collapsed=false", () => {
    beforeEach(() => {
      sandbox.stub(instance, "toggleRecommendation");
      sandbox.stub(instance, "_response").value({collapsed: false});
      instance.init(fakeHandleMessageRequest, fakeAddImpression);
    });
    it("should create a container", () => {
      fakeTarget.container.querySelector.returns(false);

      instance.showMessage(fakeMessage, fakeTarget);

      assert.equal(fakeTarget.document.createElementNS.callCount, 5);
      assert.calledOnce(fakeTarget.container.appendChild);
    });
    it("should reuse the container", () => {
      fakeTarget.container.querySelector.returns(true);

      instance.showMessage(fakeMessage, fakeTarget);

      assert.notCalled(fakeTarget.container.appendChild);
    });
    it("should open a tab with FxA signup", async () => {
      const windowStub = {ownerGlobal: {openLinkIn: sandbox.stub()}};
      fakeTarget.container.querySelector.returns(false);

      instance.showMessage(fakeMessage, fakeTarget, windowStub);
      // Call the event listener cb
      await fakeContainer.addEventListener.firstCall.args[1]();

      assert.calledOnce(windowStub.ownerGlobal.openLinkIn);
    });
    it("should collapse the message", () => {
      fakeTarget.container.querySelector.returns(false);
      sandbox.spy(instance, "collapseMessage");
      instance._response.collapsed = false;

      instance.showMessage(fakeMessage, fakeTarget);
      // Show message calls it once so we need to reset
      instance.toggleRecommendation.reset();
      // Call the event listener cb
      fakeContainer.addEventListener.secondCall.args[1]();

      assert.calledOnce(instance.collapseMessage);
      assert.calledOnce(fakeTarget.close);
      assert.isTrue(instance._response.collapsed);
      assert.calledOnce(instance.toggleRecommendation);
    });
    it("should call toggleRecommendation `true`", () => {
      instance.showMessage(fakeMessage, fakeTarget);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(instance.toggleRecommendation, true);
    });
  });
  describe("#showMessage.collapsed=true", () => {
    beforeEach(() => {
      sandbox.stub(instance, "_response").value({collapsed: true, target: fakeTarget});
      sandbox.stub(instance, "toggleRecommendation");
    });
    it("should return early if the message is collapsed", () => {
      instance.showMessage();

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(instance.toggleRecommendation, false);
    });
  });
  describe("#hideMessage", () => {
    let removeStub;
    beforeEach(() => {
      sandbox.stub(instance, "toggleRecommendation");
      removeStub = sandbox.stub();
      fakeTarget = {container: {querySelector: sandbox.stub().returns({remove: removeStub})}};
    });
    it("should remove the message", () => {
      instance.hideMessage(fakeTarget);

      assert.calledOnce(removeStub);
    });
    it("should call toggleRecommendation `false`", () => {
      instance.hideMessage(fakeTarget);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(instance.toggleRecommendation, false);
    });
  });
  describe("#toggleRecommendation", () => {
    let target;
    beforeEach(() => {
      target = {
        infoButton: {},
        recommendationContainer: {
          setAttribute: sandbox.stub(),
          removeAttribute: sandbox.stub(),
        },
      };
      sandbox.stub(instance, "_response").value({target});
    });
    it("should check infoButton", () => {
      instance.toggleRecommendation(true);

      assert.isTrue(target.infoButton.checked);
    });
    it("should uncheck infoButton", () => {
      instance.toggleRecommendation(false);

      assert.isFalse(target.infoButton.checked);
    });
    it("should uncheck infoButton", () => {
      target.infoButton.checked = true;

      instance.toggleRecommendation();

      assert.isFalse(target.infoButton.checked);
    });
    it("should disable recommendationContainer", () => {
      target.infoButton.checked = true;

      instance.toggleRecommendation();

      assert.calledOnce(target.recommendationContainer.setAttribute);
    });
    it("should enable recommendationContainer", () => {
      target.infoButton.checked = false;

      instance.toggleRecommendation();

      assert.calledOnce(target.recommendationContainer.removeAttribute);
    });
  });
  describe("#_forceShowMessage", () => {
    it("should call showMessage with the correct args", () => {
      const msg = {content: "foo"};
      const target = {infoButton: {disabled: false}, recommendationContainer: {removeAttribute: sandbox.stub()}};
      sandbox.stub(instance, "showMessage");
      sandbox.stub(instance, "_response").value({target, win: "win"});

      instance._forceShowMessage(msg);

      assert.calledOnce(instance.showMessage);
      assert.calledWithExactly(instance.showMessage, "foo", target, "win");
    });
    it("should call toggleRecommendation with true", () => {
      const msg = {content: "foo"};
      sandbox.stub(instance, "showMessage");
      sandbox.stub(instance, "toggleRecommendation");
      sandbox.stub(instance, "_response").value({fakeTarget, win: "win"});

      instance._forceShowMessage(msg);

      assert.calledOnce(instance.toggleRecommendation);
      assert.calledWithExactly(instance.toggleRecommendation, true);
    });
  });
  describe("#sendImpression", () => {
    beforeEach(() => {
      instance.init(fakeHandleMessageRequest, fakeAddImpression);
      instance._response = "foo";
    });
    it("should dispatch an impression", () => {
      instance.sendImpression();

      assert.calledOnce(fakeAddImpression);
      assert.equal(fakeAddImpression.firstCall.args[0], "foo");
    });
  });
});
