import {_ToolbarBadgeHub} from "lib/ToolbarBadgeHub.jsm";
import {GlobalOverrider} from "test/unit/utils";
import {OnboardingMessageProvider} from "lib/OnboardingMessageProvider.jsm";

describe("BookmarkPanelHub", () => {
  let sandbox;
  let instance;
  let fakeAddImpression;
  let fxaMessage;
  let fakeElement;
  let globals;
  let everyWindowStub;
  beforeEach(async () => {
    globals = new GlobalOverrider();
    sandbox = sinon.createSandbox();
    instance = new _ToolbarBadgeHub();
    fakeAddImpression = sandbox.stub();
    [,,,,,,fxaMessage] = await OnboardingMessageProvider.getUntranslatedMessages();
    fakeElement = {
      setAttribute: sandbox.stub(),
      removeAttribute: sandbox.stub(),
      querySelector: sandbox.stub(),
      addEventListener: sandbox.stub(),
    };
    // Share the same element when selecting child nodes
    fakeElement.querySelector.returns(fakeElement);
    everyWindowStub = {
      registerCallback: sandbox.stub(),
      unregisterCallback: sandbox.stub(),
    };
    globals.set("EveryWindow", everyWindowStub);
  });
  afterEach(() => {
    sandbox.restore();
  });
  it("should create an instance", () => {
    assert.ok(instance);
  });
  describe("#init", () => {
    it("should make a messageRequest on init", async () => {
      sandbox.stub(instance, "messageRequest");
      const waitForInitialized = sandbox.stub().resolves();

      await instance.init(waitForInitialized, {});
      assert.calledOnce(instance.messageRequest);
      assert.calledWithExactly(instance.messageRequest, "firstRunFxAccounts");
    });
  });
  describe("messageRequest", () => {
    let handleMessageRequestStub;
    beforeEach(() => {
      handleMessageRequestStub = sandbox.stub().returns(fxaMessage);
      sandbox.stub(instance, "_handleMessageRequest").value(handleMessageRequestStub);
      sandbox.stub(instance, "registerBadgeNotificationListener");
    });
    it("should fetch a message with the provided trigger and template", async () => {
      await instance.messageRequest("trigger"); 

      assert.calledOnce(handleMessageRequestStub);
      assert.calledWithExactly(handleMessageRequestStub, {triggerId: "trigger", template: "badge"});
    });
    it("should call addToolbarNotification with browser window and message", async () => {
      await instance.messageRequest("trigger"); 

      assert.calledOnce(instance.registerBadgeNotificationListener);
      assert.calledWithExactly(instance.registerBadgeNotificationListener, fxaMessage);
    });
    it("shouldn't do anything if no message is provided", () => {
      handleMessageRequestStub.returns(null);
      instance.messageRequest("trigger");

      assert.notCalled(instance.registerBadgeNotificationListener);
    });
  });
  describe("addToolbarNotification", () => {
    let target;
    let fakeDocument;
    beforeEach(() => {
      fakeDocument = {getElementById: sandbox.stub().returns(fakeElement)};
      target = {browser: {ownerDocument: fakeDocument}};  
    });
    it("shouldn't do anything if target element is not found", () => {
      fakeDocument.getElementById.returns(null);
      instance.addToolbarNotification(target, fxaMessage);

      assert.notCalled(fakeElement.setAttribute);
    });
    it("should target the element specified in the message", () => {
      instance.addToolbarNotification(target, fxaMessage);

      assert.calledOnce(fakeDocument.getElementById);
      assert.calledWithExactly(fakeDocument.getElementById, fxaMessage.content.target);
    });
    it("should show a notification", () => {
      instance.addToolbarNotification(target, fxaMessage);

      assert.calledTwice(fakeElement.setAttribute);
      assert.calledWithExactly(fakeElement.setAttribute, "badged", true);
      assert.calledWithExactly(fakeElement.setAttribute, "value", "x");
    });
    it("should attach a cb on the notification", () => {
      instance.addToolbarNotification(target, fxaMessage);

      assert.calledOnce(fakeElement.addEventListener);
      assert.calledWithExactly(fakeElement.addEventListener, "click",
        instance.removeAllNotifications, {once: true});
    });
  });
  describe("registerBadgeNotificationListener", () => {
    beforeEach(() => {
      sandbox.stub(instance, "_addImpression").value(fakeAddImpression);
      sandbox.stub(instance, "addToolbarNotification").returns(fakeElement);
      sandbox.stub(instance, "removeToolbarNotification");
    });
    it("should add an impression for the message", () => {
      instance.registerBadgeNotificationListener(fxaMessage);

      assert.calledOnce(instance._addImpression);
      assert.calledWithExactly(instance._addImpression, fxaMessage);
    });
    it("should register a callback that adds/removes the notification", () => {
      instance.registerBadgeNotificationListener(fxaMessage);

      assert.calledOnce(everyWindowStub.registerCallback);
      assert.calledWithExactly(everyWindowStub.registerCallback, instance.id,
        sinon.match.func, sinon.match.func);

      const [, initFn, uninitFn] = everyWindowStub.registerCallback.firstCall.args;

      initFn(window);
      // Test that it doesn't try to add a second notification
      initFn(window);

      assert.calledOnce(instance.addToolbarNotification);
      assert.calledWithExactly(instance.addToolbarNotification, window, fxaMessage);

      uninitFn(window);

      assert.calledOnce(instance.removeToolbarNotification);
      assert.calledWithExactly(instance.removeToolbarNotification, fakeElement);
    });
  });
  describe("removeToolbarNotification", () => {
    it("should remove the notification", () => {
      instance.removeToolbarNotification(fakeElement);

      assert.calledTwice(fakeElement.removeAttribute);
      assert.calledWithExactly(fakeElement.removeAttribute, "badged");
    });
  });
  describe("removeAllNotifications", () => {
    let blockMessageByIdStub
    beforeEach(() => {
      blockMessageByIdStub = sandbox.stub();
      sandbox.stub(instance, "_blockMessageById").value(blockMessageByIdStub);
      instance.state = {notification: {id: fxaMessage.id}};
    }); 
    it("should call to block the message", () => {
      instance.removeAllNotifications();

      assert.calledOnce(blockMessageByIdStub);
      assert.calledWithExactly(blockMessageByIdStub, fxaMessage.id);
    });
    it("should remove the window listener", () => {
      instance.removeAllNotifications();

      assert.calledOnce(everyWindowStub.unregisterCallback);
      assert.calledWithExactly(everyWindowStub.unregisterCallback, instance.id);
    });
  });
});
