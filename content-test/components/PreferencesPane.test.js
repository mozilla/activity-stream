const {PreferencesPane} = require("components/PreferencesPane/PreferencesPane");
const React = require("react");
const {mountWithIntl} = require("test/test-utils");
const DEFAULT_PREFS = {
  "showSearch": true,
  "showTopSites": true,
  "showHighlights": true
};

describe.only("PreferencesPane", () => {
  let wrapper;
  function setup(prefs = {}) {
    const customProps = {Prefs: {prefs: Object.assign({}, DEFAULT_PREFS, prefs)}};
    wrapper = mountWithIntl(<PreferencesPane {...customProps} />, {context: {}, childContextTypes: {}});
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    assert.ok(wrapper.find(PreferencesPane));
  });

  it("the modal should be hidden by default", () => {
    assert.equal(0, wrapper.ref("modal").length);
  });

  it("the modal should be shown when settings button is clicked", () => {
    wrapper.ref("prefs-button").simulate("click");
    assert.equal(1, wrapper.ref("modal").length);
  });

  it("the search checkbox should be checked by default", () => {
    wrapper.ref("prefs-button").simulate("click");
    assert.isTrue(wrapper.ref("showSearchCheckbox").prop("checked"));
  });

  it("the top sites checkbox should be checked by default", () => {
    wrapper.ref("prefs-button").simulate("click");
    assert.isTrue(wrapper.ref("showTopSitesCheckbox").prop("checked"));
  });

  it("the highlights checkbox should be checked by default", () => {
    wrapper.ref("prefs-button").simulate("click");
    assert.isTrue(wrapper.ref("showHighlightsCheckbox").prop("checked"));
  });

  it("the search checkbox should be unchecked if pref is off", () => {
    setup({showSearch: false});
    wrapper.ref("prefs-button").simulate("click");
    assert.isFalse(wrapper.ref("showSearchCheckbox").prop("checked"));
  });

  it("the top sites checkbox should be unchecked if pref is off", () => {
    setup({showTopSites: false});
    wrapper.ref("prefs-button").simulate("click");
    assert.isFalse(wrapper.ref("showTopSitesCheckbox").prop("checked"));
  });

  it("the highlights checkbox should be unchecked if pref is off", () => {
    setup({showHighlights: false});
    wrapper.ref("prefs-button").simulate("click");
    assert.isFalse(wrapper.ref("showHighlightsCheckbox").prop("checked"));
  });

  it("the modal should be closed when done button is clicked", () => {
    wrapper.ref("prefs-button").simulate("click");
    assert.equal(1, wrapper.ref("modal").length);
    wrapper.ref("done-button").simulate("click");
    assert.equal(0, wrapper.ref("modal").length);
  });
});
