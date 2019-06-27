import {_ToolbarBadgeHub} from "lib/ToolbarBadgeHub.jsm";
import {OnboardingMessageProvider} from "lib/OnboardingMessageProvider.jsm";

describe("BookmarkPanelHub", () => {
  let sandbox;
  let instance;
  let fakeAddImpression;
  let fxaMessage;
  let fakeElement;
  beforeEach(async () => {
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
      assert.calledWithExactly(instance.messageRequest, "firstRun");
    });
  });
  describe("messageRequest", () => {
    let handleMessageRequestStub;
    beforeEach(() => {
      handleMessageRequestStub = sandbox.stub().returns(fxaMessage);
      sandbox.stub(instance, "_handleMessageRequest").value(handleMessageRequestStub);
      sandbox.stub(instance, "addBadge");
    });
    it("should fetch a message with the provided trigger and template", async () => {
      await instance.messageRequest("trigger"); 

      assert.calledOnce(handleMessageRequestStub);
      assert.calledWithExactly(handleMessageRequestStub, {triggerId: "trigger", template: "badge"});
    });
    it("should call addBadge with browser window and message", async () => {
      await instance.messageRequest("trigger"); 

      assert.calledOnce(instance.addBadge);
      assert.calledWithExactly(instance.addBadge,
        Services.wm.getMostRecentBrowserWindow(), fxaMessage);
    });
  });
  describe("addBadge", () => {
    let target;
    let fakeDocument;
    beforeEach(() => {
      fakeDocument = {getElementById: sandbox.stub().returns(fakeElement)};
      target = {browser: {ownerDocument: fakeDocument}};  
      sandbox.stub(instance, "_addImpression").value(fakeAddImpression);
    });
    it("shouldn't do anything if no message is provided", () => {
      instance.addBadge(target, null);

      assert.notCalled(fakeDocument.getElementById);
    });
    it("shouldn't do anything if target element is not found", () => {
      fakeDocument.getElementById.returns(null);
      instance.addBadge(target, fxaMessage);

      assert.notCalled(fakeElement.setAttribute);
    });
    it("should target the element specified in the message", () => {
      instance.addBadge(target, fxaMessage);

      assert.calledOnce(fakeDocument.getElementById);
      assert.calledWithExactly(fakeDocument.getElementById, fxaMessage.content.target);
    });
    it("should show a badge", () => {
      instance.addBadge(target, fxaMessage);

      assert.calledTwice(fakeElement.setAttribute);
      assert.calledWithExactly(fakeElement.setAttribute, "badged", true);
      assert.calledWithExactly(fakeElement.setAttribute, "value", "x");
    });
    it("should attach a cb on the badge", () => {
      instance.addBadge(target, fxaMessage);

      assert.calledOnce(fakeElement.addEventListener);
      assert.calledWithExactly(fakeElement.addEventListener, "click",
        instance.removeToolbarNotification, {once: true});
    });
    it("should add an impression for the message", () => {
      instance.addBadge(target, fxaMessage);

      assert.calledOnce(instance._addImpression);
      assert.calledWithExactly(instance._addImpression, fxaMessage);
    });
  });
  describe("removeToolbarNotification", () => {
    let fakeEvent;
    let blockMessageByIdStub
    beforeEach(() => {
      fakeEvent = {target: fakeElement};
      blockMessageByIdStub = sandbox.stub();
      sandbox.stub(instance, "_blockMessageById").value(blockMessageByIdStub);
      instance.state = {badge: {id: fxaMessage.id}};
    }); 
    it("should remove the badge", () => {
      instance.removeToolbarNotification(fakeEvent);

      assert.calledTwice(fakeElement.removeAttribute);
      assert.calledWithExactly(fakeElement.removeAttribute, "badged");
    });
    it("should call to block the message", () => {
      instance.removeToolbarNotification(fakeEvent);

      assert.calledOnce(blockMessageByIdStub);
      assert.calledWithExactly(blockMessageByIdStub, fxaMessage.id);
    });
  });
});
