const {shortURL} = require("lib/ShortURL.jsm");
const {GlobalOverrider} = require("test/unit/utils");

describe("shortURL", () => {
  let globals;
  let IDNStub;

  beforeEach(() => {
    IDNStub = sinon.stub().callsFake(id => id);

    globals = new GlobalOverrider();
    globals.set("IDNService", {convertToDisplayIDN: IDNStub});
  });

  afterEach(() => {
    globals.restore();
  });

  it("should return a blank string if url and hostname is falsey", () => {
    assert.equal(shortURL({url: ""}), "");
    assert.equal(shortURL({hostname: null}), "");
  });

  it("should remove the eTLD, if provided", () => {
    assert.equal(shortURL({hostname: "com.blah.com", eTLD: "com"}), "com.blah");
  });

  it("should call convertToDisplayIDN when calling shortURL", () => {
    shortURL({hostname: "com.blah.com", eTLD: "com"});

    assert.calledOnce(IDNStub);
    assert.calledWithExactly(IDNStub, "com.blah.com", {});
  });

  it("should use the hostname, if provided", () => {
    assert.equal(shortURL({hostname: "foo.com", url: "http://bar.com", eTLD: "com"}), "foo");
  });

  it("should get the hostname from .url if necessary", () => {
    assert.equal(shortURL({url: "http://bar.com", eTLD: "com"}), "bar");
  });

  it("should not strip out www if not first subdomain", () => {
    assert.equal(shortURL({hostname: "foo.www.com", eTLD: "com"}), "foo.www");
  });

  it("should convert to lowercase", () => {
    assert.equal(shortURL({url: "HTTP://FOO.COM", eTLD: "com"}), "foo");
  });

  it("should return hostname for localhost", () => {
    assert.equal(shortURL({url: "http://localhost:8000/", eTLD: "localhost"}), "localhost");
  });

  it("should fallback to link title if it exists", () => {
    const link = {
      url: "file:///Users/voprea/Work/activity-stream/logs/coverage/system-addon/report-html/index.html",
      title: "Code coverage report"
    };

    assert.equal(shortURL(link), link.title);
  });

  it("should return the url if no hostname or title is provided", () => {
    const url = "file://foo/bar.txt";
    assert.equal(shortURL({url, eTLD: "foo"}), url);
  });
});
