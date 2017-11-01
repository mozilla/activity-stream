const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl, mountWithIntl} = require("test/unit/utils");
const {FormattedMessage} = require("react-intl");
const {PreferencesPane, PreferencesInput} = require("content-src/components/PreferencesPane/PreferencesPane");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

describe("<PreferencesInput>", () => {
  const testStrings = {
    titleString: {id: "settings_pane_search_header"},
    descString: {id: "settings_pane_search_body"}
  };
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<PreferencesInput prefName="foo" {...testStrings} />);
  });

  it("should set the name and id on the input and the 'for' attribute on the label to props.prefName", () => {
    const inputProps = wrapper.find("input").props();
    const labelProps = wrapper.find("label").props();
    assert.propertyVal(inputProps, "name", "foo");
    assert.propertyVal(inputProps, "name", "foo");
    assert.propertyVal(labelProps, "htmlFor", "foo");
  });
  it("should set the checked value of the input to props.value", () => {
    wrapper = shallow(<PreferencesInput prefName="foo" value={true} {...testStrings} />);
    assert.propertyVal(wrapper.find("input").props(), "checked", true);
  });
  it("should render a FormattedString in the label with id=titleString", () => {
    assert.propertyVal(wrapper.find("label").find(FormattedMessage).props(), "id", testStrings.titleString.id);
  });
  it("should render a FormattedString in the description with id=descString", () => {
    assert.propertyVal(wrapper.find(".prefs-input-description").find(FormattedMessage).props(), "id", testStrings.descString.id);
  });
  it("should not render the description element if no descStringId is given", () => {
    wrapper = shallow(<PreferencesInput prefName="foo" titleString="bar" />);
    assert.lengthOf(wrapper.find(".prefs-input-description"), 0);
  });
});

describe("<PreferencesPane>", () => {
  let wrapper;
  let dispatch;
  const fakePrefs = {values: {showSearch: true, showTopSites: true}};
  const fakeSections = [
    {id: "section1", shouldHidePref: false, enabled: true, pref: {titleString: "section1", feed: "section1_feed"}},
    {id: "section2", shouldHidePref: false, enabled: false, pref: {titleString: "section2"}},
    {id: "section3", shouldHidePref: true, enabled: true, pref: {titleString: {id: "section3"}}},
    {
      id: "section4",
      shouldHidePref: false,
      enabled: true,
      pref: {
        titleString: {id: "section4"},
        nestedPrefs: [
          {
            name: "nestedPref1",
            titleString: {id: "Some nested pref", values: {}},
            icon: "icon-info"
          }, {
            name: "nestedPref2",
            titleString: {id: "Some other nested pref", values: {}},
            icon: "icon-info"
          }
        ]
      }
    }
  ];
  const fakePreferencesPane = {visible: false};

  function setup(props = {}) {
    dispatch = sinon.spy();
    const defaultProps = {
      dispatch,
      Prefs: fakePrefs,
      Sections: fakeSections,
      PreferencesPane: fakePreferencesPane
    };
    const customProps = Object.assign({}, defaultProps, props);
    wrapper = shallowWithIntl(<PreferencesPane {...customProps} />);
  }
  beforeEach(() => setup());

  it("should hide the sidebar and show a settings icon by default", () => {
    assert.isTrue(wrapper.find(".sidebar").hasClass("hidden"));
    assert.isTrue(wrapper.find(".prefs-button").hasClass("icon-settings"));
  });
  it("should show the sidebar and show a dismiss icon if PreferencesPane.visible is true", () => {
    setup({PreferencesPane: {visible: true}});

    assert.isFalse(wrapper.find(".sidebar").hasClass("hidden"));
    assert.isTrue(wrapper.find(".prefs-button").hasClass("icon-dismiss"));
  });
  it("should dispatch SETTINGS_OPEN action when the top corner button is clicked and send the right telemetry", () => {
    const button = wrapper.find(".prefs-button");
    assert.isFalse(wrapper.instance().isSidebarOpen());

    button.simulate("click", {});
    assert.calledWith(dispatch, {type: at.SETTINGS_OPEN});
    assert.calledWith(dispatch, ac.UserEvent({event: "OPEN_NEWTAB_PREFS"}));
  });
  it("should dispatch SETTINGS_CLOSE action when the top corner button is clicked and send the right telemetry", () => {
    setup({PreferencesPane: {visible: true}});
    const button = wrapper.find(".prefs-button");
    assert.isTrue(wrapper.instance().isSidebarOpen());

    button.simulate("click", {});
    assert.calledWith(dispatch, {type: at.SETTINGS_CLOSE});
    assert.calledWith(dispatch, ac.UserEvent({event: "CLOSE_NEWTAB_PREFS"}));
  });
  it("should dispatch SETTINGS_CLOSE when done button is clicked", () => {
    setup({PreferencesPane: {visible: true}});
    assert.isFalse(wrapper.find(".sidebar").hasClass("hidden"));

    wrapper.find("button.done").simulate("click");
    assert.calledWith(dispatch, {type: at.SETTINGS_CLOSE});
  });
  it("should dispatch SETTINGS_CLOSE when anything outside the component is clicked", () => {
    const props = {
      dispatch,
      Prefs: fakePrefs,
      Sections: fakeSections,
      PreferencesPane: {visible: true}
    };
    wrapper = mountWithIntl(<PreferencesPane {...props} />);
    assert.isFalse(wrapper.find(".sidebar").hasClass("hidden"));

    wrapper.instance().handleClickOutside({target: document.createElement("div")});
    assert.calledWith(dispatch, {type: at.SETTINGS_CLOSE});
  });
  it("should dispatch a SetPref action when a non-section PreferencesInput is clicked", () => {
    const showSearchWrapper = wrapper.find(".showSearch");
    showSearchWrapper.simulate("change", {target: {name: "showSearch", checked: false}});
    assert.calledOnce(dispatch);
    assert.calledWith(dispatch, ac.SetPref("showSearch", false));
  });
  it("should show PreferencesInputs for a section if and only if shouldHidePref is false", () => {
    const sectionsWrapper = wrapper.find(".showSection");
    assert.equal(sectionsWrapper.length, 3);

    assert.ok(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section1_feed" />));
    assert.ok(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section2" />));
    assert.notOk(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section3" />));
    assert.ok(sectionsWrapper.containsMatchingElement(
      <PreferencesInput prefName="section4">
        <PreferencesInput prefName="nestedPref1" />
        <PreferencesInput prefName="nestedPref2" />
      </PreferencesInput>)
    );
  });
  it("should set the value prop of a section PreferencesInput to equal section.enabled", () => {
    const section1 = wrapper.findWhere(prefInput => prefInput.props().prefName === "section1_feed");
    const section2 = wrapper.findWhere(prefInput => prefInput.props().prefName === "section2");
    assert.equal(section1.props().value, true);
    assert.equal(section2.props().value, false);
  });
  it("should show the snippets preference if disableSnippets is false", () => {
    setup({Prefs: {values: {disableSnippets: false}}});
    const section = wrapper.findWhere(prefInput => prefInput.props().prefName === "feeds.snippets");
    assert.lengthOf(section, 1);
  });
  it("should hide the snippets preference if disableSnippets is true", () => {
    setup({Prefs: {values: {disableSnippets: true}}});
    const section = wrapper.findWhere(prefInput => prefInput.props().prefName === "feeds.snippets");
    assert.lengthOf(section, 0);
  });
  it("should dispatch a SetPref with the right value for topSitesCount when unchecked", () => {
    const showMoreTopSitesWrapper = wrapper.find(".showMoreTopSites");
    showMoreTopSitesWrapper.simulate("change", {target: {name: "topSitesCount", checked: false}});
    assert.calledOnce(dispatch);
    assert.calledWith(dispatch, ac.SetPref("topSitesCount", 6));
  });
  it("should dispatch a SetPref with the right value for topSitesCount when checked", () => {
    const showMoreTopSitesWrapper = wrapper.find(".showMoreTopSites");
    showMoreTopSitesWrapper.simulate("change", {target: {name: "topSitesCount", checked: true}});
    assert.calledOnce(dispatch);
    assert.calledWith(dispatch, ac.SetPref("topSitesCount", 12));
  });
  it("should render nested PreferencesInput for nested Section pref", () => {
    const nestedPrefsWrapper = wrapper.find(".showSection");
    assert.ok(nestedPrefsWrapper.containsMatchingElement(<PreferencesInput prefName="nestedPref1" />));
    assert.ok(nestedPrefsWrapper.containsMatchingElement(<PreferencesInput prefName="nestedPref2" />));
  });
  it("should dispatch a SetPref action when a nested PreferencesInput is clicked", () => {
    const section1 = wrapper.findWhere(prefInput => prefInput.props().prefName === "nestedPref1");
    section1.simulate("change", {target: {name: "nestedPref1", checked: false}});
    assert.calledOnce(dispatch);
    assert.calledWith(dispatch, ac.SetPref("nestedPref1", false));
  });
});
