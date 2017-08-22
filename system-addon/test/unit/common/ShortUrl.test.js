const {ShortURL} = require("lib/ShortURL.jsm");
const {GlobalOverrider} = require("test/unit/utils");

describe("shortURL", () => {
  let globals;
  let displayIDNStub;
  let instance;

  beforeEach(() => {
    displayIDNStub = sinon.stub().callsFake(i => i);
    globals = new GlobalOverrider();
    global.Components.classes["@mozilla.org/network/idn-service;1"] = {
      getService() {
        return {convertToDisplayIDN: displayIDNStub};
      }
    };
    instance = new ShortURL();
  });

  afterEach(() => {
    globals.restore();
  });

  it("should load IDNService", () => {
    assert.isDefined(instance.IDNService);
  });

  it("should return a blank string if url and hostname is falsey", () => {
    assert.equal(instance.shortURL({url: ""}), "");
    assert.equal(instance.shortURL({hostname: null}), "");
  });

  it("should remove the eTLD, if provided", () => {
    assert.equal(instance.shortURL({hostname: "com.blah.com", eTLD: "com"}), "com.blah");
  });

  it("should call convertToDisplayIDN", () => {
    instance.shortURL({hostname: "com.blah.com"});

    assert.calledOnce(displayIDNStub);
    assert.calledWithExactly(displayIDNStub, "com.blah.com", {});
  });

  it("should catch convertToDisplayIDN errors and return its arguments", () => {
    const displayIDNStubThrows = sinon.stub().callsFake(() => { throw new Error(); });
    instance.IDNService = {convertToDisplayIDN: displayIDNStubThrows};

    const result = instance.shortURL({hostname: "foo.com"});

    assert.equal(result, "foo");
  });

  it("should use the hostname, if provided", () => {
    assert.equal(instance.shortURL({hostname: "foo.com", url: "http://bar.com", eTLD: "com"}), "foo");
  });

  it("should get the hostname from .url if necessary", () => {
    assert.equal(instance.shortURL({url: "http://bar.com", eTLD: "com"}), "bar");
  });

  it("should not strip out www if not first subdomain", () => {
    assert.equal(instance.shortURL({hostname: "foo.www.com", eTLD: "com"}), "foo.www");
  });

  it("should convert to lowercase", () => {
    assert.equal(instance.shortURL({url: "HTTP://FOO.COM", eTLD: "com"}), "foo");
  });

  it("should return hostname for localhost", () => {
    assert.equal(instance.shortURL({url: "http://localhost:8000/", eTLD: "localhost"}), "localhost");
  });

  it("should fallback to link title if it exists", () => {
    const link = {
      url: "file:///Users/voprea/Work/activity-stream/logs/coverage/system-addon/report-html/index.html",
      title: "Code coverage report"
    };

    assert.equal(instance.shortURL(link), link.title);
  });

  it("should return the url if no hostname or title is provided", () => {
    const url = "file://foo/bar.txt";
    assert.equal(instance.shortURL({url, eTLD: "foo"}), url);
  });
});
