import {_ToolbarPanelHub} from "lib/ToolbarPanelHub.jsm";
import {GlobalOverrider} from "test/unit/utils";

describe("ToolbarPanelHub", () => {
  let globals;
  let sandbox;
  let instance;
  let everyWindowStub;
  let fakeWindow;
  let fakeElementById;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    globals = new GlobalOverrider();
    instance = new _ToolbarPanelHub();
    fakeElementById = {
      setAttribute: sandbox.stub(),
      removeAttribute: sandbox.stub(),
    };
    fakeWindow = {
      browser: {
        ownerDocument: {
          l10n: {
            setAttributes: sandbox.stub()
          },
          getElementById: sandbox.stub().returns(fakeElementById),
          querySelector:  sandbox.stub().returns({}),
        }
      },
      MozXULElement: {insertFTLIfNeeded: sandbox.stub()},
    };
    everyWindowStub = {
      registerCallback: sandbox.stub(),
      unregisterCallback: sandbox.stub(),
    };
    globals.set("EveryWindow", everyWindowStub);
  });
  afterEach(() => {
    instance.uninit();
    sandbox.restore();
  });
  it("should create an instance", () => {
    assert.ok(instance);
  });
  it("should not enableAppmenuButton() on init if pref is not enabled", () => {
    sandbox.stub(global.Services.prefs, "getBoolPref").returns(false);
    instance.enableAppmenuButton = sandbox.stub();
    instance.init();
    assert.notCalled(instance.enableAppmenuButton);
  });
  it("should enableAppmenuButton() on init if pref is enabled", () => {
    sandbox.stub(global.Services.prefs, "getBoolPref").returns(true);
    instance.enableAppmenuButton = sandbox.stub();
    instance.init();
    assert.calledOnce(instance.enableAppmenuButton);
  });
  it("should unregisterCallback on uninit", () => {
    instance.uninit();
    assert.calledTwice(everyWindowStub.unregisterCallback);
  });
  it("should registerCallback on enableAppmenuButton", () => {
    instance.enableAppmenuButton();
    assert.calledOnce(everyWindowStub.registerCallback);
  });
  it("should registerCallback on enableToolbarButton", () => {
    instance.enableToolbarButton();
    assert.calledOnce(everyWindowStub.registerCallback);
  });
  it("should unhide appmenu button on _showAppmenuButton", () => {
    instance._showAppmenuButton(fakeWindow);
    assert.calledWith(fakeElementById.removeAttribute, "hidden");
  });
  it("should hide appmenu button on _hideAppmenuButton", () => {
    instance._hideAppmenuButton(fakeWindow);
    assert.calledWith(fakeElementById.setAttribute, "hidden", true);
  });
  it("should unhide toolbar button on _showToolbarButton", () => {
    instance._showToolbarButton(fakeWindow);
    assert.calledWith(fakeElementById.removeAttribute, "hidden");
  });
  it("should hide toolbar button on _hideToolbarButton", () => {
    instance._hideToolbarButton(fakeWindow);
    assert.calledWith(fakeElementById.setAttribute, "hidden", true);
  });
});
