const test = require("sdk/test");
const {before, after} = require("sdk/test/utils");
const {PageScraper} = require("lib/PageScraper");
const simplePrefs = require("sdk/simple-prefs");

let ps;
let prevPrefValue;

function setPref(value) {
  simplePrefs.prefs[PageScraper.PAGE_SCRAPER_PREF] = value;
}

exports["test PageScraper"] = assert => {
  assert.ok(ps.pageMod, "has .pageMod");
};

before(exports, () => {
  prevPrefValue = simplePrefs.prefs[PageScraper.PAGE_SCRAPER_PREF];
  ps = new PageScraper();
  setPref(true);
});

after(exports, () => {
  ps.unload();
  setPref(prevPrefValue);
});

test.run(exports);
