const injector = require("inject!lib/ActivityStream.jsm");

describe("ActivityStream", () => {
  let sandbox;
  let as;
  let ActivityStream;
  before(() => {
    sandbox = sinon.sandbox.create();
    function NewTabInit() {}
    ({ActivityStream} = injector({
      "lib/NewTabInit.jsm": {NewTabInit}
    }));
  });

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    as = new ActivityStream();
    sandbox.stub(as.store, "init");
    sandbox.stub(as.store, "uninit");
  });

  it("should exist", () => {
    assert.ok(ActivityStream);
  });
  it("should initialize with .initialized=false", () => {
    assert.isFalse(as.initialized, ".initialized");
  });
  describe("#init", () => {
    beforeEach(() => {
      as.init();
    });
    it("should set .initialized to true", () => {
      assert.isTrue(as.initialized, ".initialized");
    });
    it("should call .store.init", () => {
      assert.calledOnce(as.store.init);
    });
  });
  describe("#uninit", () => {
    beforeEach(() => {
      as.init();
      as.uninit();
    });
    it("should set .initialized to false", () => {
      assert.isFalse(as.initialized, ".initialized");
    });
    it("should call .store.uninit", () => {
      assert.calledOnce(as.store.uninit);
    });
  });
});
