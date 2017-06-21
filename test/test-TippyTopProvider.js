"use strict";

const {Cu} = require("chrome");
Cu.importGlobalProperties(["URL"]);

const {TippyTopProvider} = require("addon/TippyTopProvider");
const {IMAGE_SIZE} = require("common/vendor")("tippy-top-sites");

exports["test TippyTopProvider init"] = function(assert) {
  // Test the default init
  let tippyTopProvider = new TippyTopProvider();
  let site = {url: "http://somecraycrayurl.com"};
  assert.deepEqual(site, tippyTopProvider.processSite(site));

  // Test init with options
  tippyTopProvider = new TippyTopProvider({
    sites: [{
      url: "https://mozilla.org",
      image_url: "mozilla-org.png",
      background_color: "#fff"
    }]
  });
  assert.deepEqual(site, tippyTopProvider.processSite(site));
};

exports["test TippyTopProvider processSite"] = function(assert) {
  // Test init with options
  let tippyTopProvider = new TippyTopProvider({
    getSiteData: url => {
      let sites = {
        "mozilla.org": {
          url: "https://mozilla.org",
          image_url: "mozilla-org.png",
          background_color: "#fff"
        },
        "github.com": {
          url: "http://github.com",
          image_url: "github-com.png",
          background_color: "#eee"
        },
        "example.com": {
          url: "https://www.example.com",
          image_url: "example-com.png",
          background_color: "#ddd"
        }
      };

      let domain = new URL(url).host;
      if (domain && domain.startsWith("www.")) {
        domain = domain.slice(4);
      }

      if (domain in sites) {
        return sites[domain];
      }
      return {};
    }
  });

  // Test with an unknown site
  let site = {url: "http://somecraycrayurl.com/boo/yaaa"};
  assert.deepEqual(site, tippyTopProvider.processSite(site));

  // Test with a known site
  site = {url: "https://mozilla.org"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/mozilla-org.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#fff",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a site with domain match but different protocol
  site = {url: "https://github.com"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/github-com.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#eee",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a site with known url but 'www.' prepended
  site = {url: "http://www.github.com"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/github-com.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#eee",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a site with known url but without the 'www.'
  site = {url: "http://example.com"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/example-com.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#ddd",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a known site but adding an arbitrary path
  site = {url: "https://mozilla.org/an/arbitrary/path"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/mozilla-org.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#fff",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a known site but adding an arbitrary query string
  site = {url: "https://mozilla.org?anarbitrary=querystring"};
  assert.deepEqual({
    url: site.url,
    favicon_url: "resource://activity-stream-shield-study/data/content/favicons/images/mozilla-org.png",
    favicon_height: IMAGE_SIZE,
    favicon_width: IMAGE_SIZE,
    background_color: "#fff",
    metadata_source: "TippyTopProvider"
  }, tippyTopProvider.processSite(site));

  // Test with a known site but prepend a non www subdomain. It shouldnt match.
  site = {url: "https://support.mozilla.org"};
  assert.deepEqual(site, tippyTopProvider.processSite(site));
};

require("sdk/test").run(exports);
