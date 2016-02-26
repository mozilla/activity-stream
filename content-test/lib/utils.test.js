const {assert} = require("chai");
const utils = require("lib/utils");
const urlParse = require("url-parse");

describe("toRGBString", () => {
  it("should convert R, G, B values to a css string", () => {
    assert.equal(utils.toRGBString(12, 20, 30), "rgb(12, 20, 30)");
  });
  it("should convert R, G, B, A values to a css string", () => {
    assert.equal(utils.toRGBString(12, 20, 30, 0.2), "rgba(12, 20, 30, 0.2)");
  });
});

describe("getBlackOrWhite", () => {
  it("should return black for a light color", () => {
    assert.equal(utils.getBlackOrWhite(230, 210, 210), "black");
  });
  it("should return white for a dark color", () => {
    assert.equal(utils.getBlackOrWhite(40, 44, 52), "white");
  });
});

describe("prettyUrl()", () => {
  it("should return a blank string if url is falsey", () => {
    assert.equal(utils.prettyUrl(), "");
    assert.equal(utils.prettyUrl(null), "");
  });

  it("should strip out leading http:// or https://", () => {
    assert.equal(utils.prettyUrl("http://mozilla.org/"), "mozilla.org/");
    assert.equal(utils.prettyUrl("https://mozilla.org/"), "mozilla.org/");
  });

  it("should convert to lowercase", () => {
    assert.equal(utils.prettyUrl("FOO.COM"), "foo.com");
  });

  it("should strip out leading 'www.' subdomains", () => {
    assert.equal(utils.prettyUrl("https://www.mozilla.org/"), "mozilla.org/");
  });

  it("should strip out leading 'www.' for protocol-less URLS as well", () => {
    assert.equal(utils.prettyUrl("www.foo.com"), "foo.com");
    assert.equal(utils.prettyUrl("WWW.foo.com"), "foo.com");
  });

  it("should ignore non http[s] protocols", () => {
    let url = "gopher://github.com/mozilla/";
    assert.equal(utils.prettyUrl(url), url);
  });

  it("should not www if not first subdomain", () => {
    assert.equal(utils.prettyUrl("foo.www.com"), "foo.www.com");
  });
});

describe("sanitizeUrl()", () => {
  it("should return a blank string if url is falsey", () => {
    assert.equal(utils.sanitizeUrl(""), "");
    assert.equal(utils.sanitizeUrl(null), "");
  });

  it("should return a url if we pass in a random string/hostname", () => {
    assert.equal(utils.sanitizeUrl("foo"), "http://foo");
  });

  it("should return a url if we pass in a url-parse `site` object", () => {
    const site = urlParse("https://search.yahoo.com/yhs/search?p=avocados&ei=UTF-8&hspart=mozilla&hsimp=yhs-001", true);
    assert.equal(utils.sanitizeUrl({parsedUrl: site}), "https://search.yahoo.com/yhs/search?p=avocados");
  });

  it("should return a url minus any basic auth tokens", () => {
    assert.equal(utils.sanitizeUrl("https://user:pass@localhost.biz"), "https://localhost.biz");
  });

  it("should filter out any unapproved query string arguments", () => {
    // HackerNews/YCombinator uses `?id={term}`
    assert.equal(utils.sanitizeUrl("https://news.ycombinator.com/item?id=11175258"), "https://news.ycombinator.com/item?id=11175258");

    // Yahoo! uses `?p={term}`
    assert.equal(utils.sanitizeUrl("https://search.yahoo.com/yhs/search?p=avocados&ei=UTF-8&hspart=mozilla&hsimp=yhs-001"), "https://search.yahoo.com/yhs/search?p=avocados");

    // Bing uses `?q={term}`
    assert.equal(utils.sanitizeUrl("https://www.bing.com/search?q=cabbage&pc=MOZI&form=MOZSBR"), "https://www.bing.com/search?q=cabbage");
    // DuckDuckGo uses `?q={term}`
    assert.equal(utils.sanitizeUrl("https://duckduckgo.com/?q=daikon&t=ffsb&ia=meanings"), "https://duckduckgo.com/?q=daikon");
    // GitHub uses `?q={term}`
    assert.equal(utils.sanitizeUrl("https://github.com/mozilla/activity-streams/search?utf8=%E2%9C%93&q=neato"), "https://github.com/mozilla/activity-streams/search?q=neato");
    // Google uses `?q={term}`
    assert.equal(utils.sanitizeUrl("https://www.google.com/search?q=bananas&ie=utf-8&oe=utf-8"), "https://www.google.com/search?q=bananas");
    // Twitter uses `?q={term}`
    assert.equal(utils.sanitizeUrl("https://twitter.com/search?q=herring&partner=Firefox&source=desktop-search"), "https://twitter.com/search?q=herring");

    // Chipolte uses `?query={term}`
    assert.equal(utils.sanitizeUrl("http://www.chipotle.com/searches/#/?query=barbacoa"), "http://www.chipotle.com/searches/#/?query=barbacoa");

    // WordPress.com uses `?s={term}`
    assert.equal(utils.sanitizeUrl("https://en.blog.wordpress.com/?s=durian"), "https://en.blog.wordpress.com/?s=durian");

    // wiki.mozilla.org uses `?search={term}`
    assert.equal(utils.sanitizeUrl("https://wiki.mozilla.org/index.php?search=find+my+device&title=Special%3ASearch&go=Go"), "https://wiki.mozilla.org/index.php?search=find%2Bmy%2Bdevice");

    // Google Site-specific search uses both `?q={term}` and `?sitesearch={site}`
    assert.equal(utils.sanitizeUrl("https://www.google.com/search?sitesearch=octopress.org&q=theme&gws_rd=ssl"), "https://www.google.com/search?sitesearch=octopress.org&q=theme");

    // Amazon uses `?field-keywords={term}`, so we can't return any usable query params.
    assert.equal(utils.sanitizeUrl("https://www.amazon.com/s?ie=UTF8&field-keywords=eggplant&index=blended&link_code=qs&sourceid=Mozilla-search&tag=mozilla-20"), "https://www.amazon.com/s");

    // EBay uses `?_nkw={term}`, so we can't return any usable query params.
    assert.equal(utils.sanitizeUrl("http://www.ebay.com/sch/i.html?_nkw=gravlax&clk_rvr_id=988356360123&mfe=search"), "http://www.ebay.com/sch/i.html");
  });
});
