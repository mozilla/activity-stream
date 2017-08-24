const React = require("react");
const {shallow} = require("enzyme");
const {shallowWithIntl} = require("test/unit/utils");
const {FormattedMessage} = require("react-intl");
const {PreferencesPane, PreferencesInput} = require("content-src/components/PreferencesPane/PreferencesPane");
const {actionCreators: ac} = require("common/Actions.jsm");

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
  beforeEach(() => {
    dispatch = sinon.spy();
    const fakePrefs = {values: {showSearch: true, showTopSites: true}};
    const fakeSections = [
      {id: "section1", shouldHidePref: false, enabled: true, pref: {title: "fake_title", feed: "section1_feed"}},
      {id: "section2", shouldHidePref: false, enabled: false, pref: {}},
      {id: "section3", shouldHidePref: true, enabled: true}
    ];
    wrapper = shallowWithIntl(<PreferencesPane dispatch={dispatch} Prefs={fakePrefs} Sections={fakeSections} />);
  });
  it("should hide the sidebar and show a settings icon by default", () => {
    assert.isTrue(wrapper.find(".sidebar").hasClass("hidden"));
    assert.isTrue(wrapper.find(".prefs-button").hasClass("icon-settings"));
  });
  it("should show the sidebar and show a dismiss icon if state.visible is true", () => {
    wrapper.setState({visible: true});

    assert.isFalse(wrapper.find(".sidebar").hasClass("hidden"));
    assert.isTrue(wrapper.find(".prefs-button").hasClass("icon-dismiss"));
  });
  it("should toggle state.visible when the top corner button is clicked and send the right telemetry", () => {
    const button = wrapper.find(".prefs-button");
    assert.isFalse(wrapper.state("visible"));

    button.simulate("click", {});
    assert.isTrue(wrapper.state("visible"));
    assert.calledWith(dispatch, ac.UserEvent({event: "OPEN_NEWTAB_PREFS"}));

    dispatch.reset();

    button.simulate("click", {});
    assert.isFalse(wrapper.state("visible"));
    assert.calledWith(dispatch, ac.UserEvent({event: "CLOSE_NEWTAB_PREFS"}));
  });
  it("the sidebar should be closed when done button is clicked", () => {
    wrapper.setState({visible: true});
    assert.isFalse(wrapper.find(".sidebar").hasClass("hidden"));

    wrapper.find("button.done").simulate("click");
    assert.isTrue(wrapper.find(".sidebar").hasClass("hidden"));
  });
  it("should dispatch a SetPref action when a non-section PreferencesInput is clicked", () => {
    const showSearchWrapper = wrapper.find(".showSearch");
    showSearchWrapper.simulate("change", {target: {name: "showSearch", checked: false}});
    assert.calledOnce(dispatch);
    assert.calledWith(dispatch, ac.SetPref("showSearch", false));
  });
  it("should show PreferencesInputs for a section if and only if shouldHidePref is false", () => {
    const sectionsWrapper = wrapper.find(".showSection");
    assert.equal(sectionsWrapper.length, 2);
    assert.ok(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section1_feed" />));
    assert.ok(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section2" />));
    assert.notOk(sectionsWrapper.containsMatchingElement(<PreferencesInput prefName="section3" />));
  });
  it("should set the value prop of a section PreferencesInput to equal section.enabled", () => {
    const section1 = wrapper.findWhere(prefInput => prefInput.props().prefName === "section1_feed");
    const section2 = wrapper.findWhere(prefInput => prefInput.props().prefName === "section2");
    assert.equal(section1.props().value, true);
    assert.equal(section2.props().value, false);
  });
});
