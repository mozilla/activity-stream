const React = require("react");
const {Search} = require("components/Search/Search");
const {mountWithIntl} = require("test/test-utils");

const DEFAULT_PROPS = {
  searchString: "",
  suggestions: [],
  formHistory: [],
  currentEngine: {
    name: "",
    icon: ""
  },
  engines: [],
  dispatch: () => {}
};

describe("Search", () => {
  let wrapper;

  function setup(customProps = {}) {
    const props = Object.assign({}, DEFAULT_PROPS, customProps);
    wrapper = mountWithIntl(<Search {...props} />, {context: {}, childContextTypes: {}});
  }

  beforeEach(setup);

  it("should send a perform search event when you click the search button", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_PERFORM_SEARCH") {
          assert.equal(action.data.searchString, "hello");
          done();
        }
      },
      searchString: "hello"
    };
    setup(props);
    // click on the search button
    wrapper.ref("performSearchButton").simulate("click", {preventDefault: () => {}});
  });

  it("should request suggestions when input field changes", done => {
    const props = {
      dispatch: action => {
        if (action.type === "SEARCH_SUGGESTIONS_REQUEST") {
          assert.equal(action.data.searchString, "hello");
          done();
        }
      }
    };
    setup(props);
    // give the input field a value in order to trigger suggestions
    wrapper.ref("searchInput").simulate("change", {target: {value: "hello"}});
  });

  it("should update the search string when input field changes", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_UPDATE_SEARCH_STRING") {
          assert.equal(action.data.searchString, "hello");
          done();
        }
      }
    };
    setup(props);
    // as the value in the input field changes, it will update the search string
    wrapper.ref("searchInput").simulate("change", {target: {value: "hello"}});
  });

  it("should fire a manage engines event when the search settings button is clicked", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_MANAGE_ENGINES") {
          done();
        }
      }
    };
    setup(props);
    // click on the 'Change Search Settings' button
    wrapper.ref("searchSettingsButton").simulate("click");
  });

  it("should show the drop down when the input field has a string and it is focused", () => {
    const props = {searchString: "hello"};
    setup(props);
    // in order to see the drop down, there must be a search string and focus
    // must be true
    wrapper.setState({focus: true});
    assert.equal(wrapper.hasClass("hidden"), false);
    assert.equal(wrapper.ref("searchInput").prop("aria-expanded"), true);
  });

  it("should show form history if there is any", () => {
    const props = {formHistory: ["hello", "hi"]};
    setup(props);
    // add some form history and see that it gets added to the drop down's
    // list of suggestions
    let el = wrapper.ref("formHistoryList");
    assert.equal(el.children().length, 2);
    assert.equal(el.childAt(0).text(), "hello");
    assert.equal(el.childAt(1).text(), "hi");
  });

  it("should show suggestions if there are any", () => {
    const props = {suggestions: ["hello", "hi"]};
    setup(props);
    // add some suggestions and see that it gets added to the drop down's
    // list of suggestions
    let el = wrapper.ref("suggestionsList");
    assert.equal(el.children().length, 2);
    assert.equal(el.childAt(0).text(), "hello");
    assert.equal(el.childAt(1).text(), "hi");
  });

  it("should send perform search event if suggestion is active and enter key is pressed", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_PERFORM_SEARCH") {
          assert.equal(action.data.searchString, "hello");
          assert.equal(action.data.engineName, "Google");
          done();
        }
      },
      searchString: "he",
      suggestions: ["hello"],
      currentEngine: {name: "Google"}
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the first
    // suggestion available, and the active engine index to -1 so it will use the
    // current engine, then press 'Enter'. It will trigger a search
    wrapper.setState({focus: true, activeSuggestionIndex: 0, activeIndex: 0, activeEngineIndex: -1});
    wrapper.ref("searchInput").simulate("keyDown", {key: "Enter"});
  });

  it("should send remove form history event with proper key binding", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_REMOVE_FORM_HISTORY_ENTRY") {
          assert.equal(action.data, "hello");
          done();
        }
      },
      searchString: "hello",
      formHistory: ["hello", "hi"]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the first
    // suggestion available and press 'Delete'. It will remove the form history entry
    wrapper.setState({focus: true, activeSuggestionIndex: 0, activeIndex: 0});
    wrapper.ref("searchInput").simulate("keyDown", {key: "Delete"});
  });

  it("should increase the active suggestion ID when key down happens in suggestions", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the first
    // suggestion available and move down to the next available suggestion
    wrapper.setState({focus: true, activeSuggestionIndex: 0, activeIndex: 0});
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowDown"});
    assert.equal(wrapper.state("activeSuggestionIndex"), 1);
    assert.equal(wrapper.state("activeIndex"), 1);
    // Moving down one more will reset the active suggestion, as there are no more suggestions
    // active, but will still increase the current active index
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowDown"});
    assert.equal(wrapper.state("activeSuggestionIndex"), -1);
    assert.equal(wrapper.state("activeIndex"), 2);
  });

  it("should decrease the active suggestion ID when key up happens in suggestions", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the second
    // suggestion available and move up to the next available suggestion
    wrapper.setState({focus: true, activeSuggestionIndex: 1, activeIndex: 1});
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp"});
    assert.equal(wrapper.state("activeSuggestionIndex"), 0);
    assert.equal(wrapper.state("activeIndex"), 0);
    // Moving up one more will reset the active suggestion, as there are no more suggestions
    // active, and will reset the active index
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp"});
    assert.equal(wrapper.state("activeSuggestionIndex"), -1);
    assert.equal(wrapper.state("activeIndex"), -1);
  });

  it("should increase the active engine ID when key down happens in visible engines", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are navigating through engines list and the active engine to the first available
    // engine. Move down to next available engine
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 2, activeEngineIndex: 0});
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowDown"});
    assert.equal(wrapper.state("activeEngineIndex"), 1);
    assert.equal(wrapper.state("activeIndex"), 3);
    // Moving down one more will reset the active engine, as there are no more engines
    // to visit, but will still increase the current active index
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowDown"});
    assert.equal(wrapper.state("activeEngineIndex"), -1);
    assert.equal(wrapper.state("activeIndex"), 4);
  });

  it("should decrease the active engine ID when key up happens in visible engines", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are navigating through engines list and the active engine to the second available
    // engine. Move up to next available engine
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 3, activeEngineIndex: 1});
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp"});
    assert.equal(wrapper.state("activeEngineIndex"), 0);
    assert.equal(wrapper.state("activeIndex"), 2);
    // Moving up one more will reset the active engine, as there are no more engines
    // to visit, and will decrease the active index
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp"});
    assert.equal(wrapper.state("activeEngineIndex"), -1);
    assert.equal(wrapper.state("activeIndex"), 1);
  });

  it("should increase the active engine ID when tab is pressed in visible engines", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are navigating through engines list and the active engine to the first available
    // engine. Press 'Tab' to move forwards to next available engine
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 2, activeEngineIndex: 0});
    wrapper.ref("searchInput").simulate("keyDown", {key: "Tab"});
    assert.equal(wrapper.state("activeEngineIndex"), 1);
    assert.equal(wrapper.state("activeIndex"), 3);
  });

  it("should decrease the active engine ID when shift + tab is pressed in visible engines", () => {
    const props = {
      searchString: "he",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are navigating through engines list and the active engine to the second available
    // engine. Press 'Shift + Tab' to move backwards to next available engine
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 3, activeEngineIndex: 1});
    wrapper.ref("searchInput").simulate("keyDown", {key: "Tab", shiftKey: true});
    assert.equal(wrapper.state("activeEngineIndex"), 0);
    assert.equal(wrapper.state("activeIndex"), 2);
  });

  it("should send cycle current engine event with proper key down binding and update current engine", done => {
    const props = {
      dispatch: action => {
        if (action.type === "SEARCH_CYCLE_CURRENT_ENGINE_REQUEST") {
          assert.equal(action.data, "Yahoo");
        }
      },
      searchString: "hel",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are cycling through engines and the active engine to the first available
    // engine. Cycle to next available engine using the associated key binding
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 2, activeEngineIndex: 0});
    assert.equal(props.engines[wrapper.state("activeEngineIndex")].name, "Google");
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowDown", metaKey: true, altKey: true});
    assert.equal(wrapper.state("activeEngineIndex"), 1);
    assert.equal(wrapper.state("activeIndex"), 3);
    done();
  });

  it("should send cycle current engine event with proper key up binding and update current engine", done => {
    const props = {
      dispatch: action => {
        if (action.type === "SEARCH_CYCLE_CURRENT_ENGINE_REQUEST") {
          assert.equal(action.data, "Google");
        }
      },
      searchString: "hel",
      suggestions: ["hello", "hello world"],
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1, as we
    // are cycling through engines and the active engine to the first available
    // engine. Cycle to next available engine using the associated key binding
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: 3, activeEngineIndex: 1});
    assert.equal(props.engines[wrapper.state("activeEngineIndex")].name, "Yahoo");
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp", metaKey: true, altKey: true});
    assert.equal(wrapper.state("activeEngineIndex"), 0);
    assert.equal(wrapper.state("activeIndex"), 2);
    done();
  });

  it("should perform a search if you click on a suggestion", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_PERFORM_SEARCH") {
          assert.equal(action.data.searchString, "hello");
          assert.equal(action.data.engineName, "Google");
          done();
        }
      },
      searchString: "he",
      currentEngine: {name: "Google"},
      suggestions: ["hello"]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the first
    // available suggestion, and the active engine to -1 so it uses the default
    // engine. Click on the suggestion.
    wrapper.setState({focus: true, activeSuggestionIndex: 0, activeIndex: 0, activeEngineIndex: -1});
    wrapper.ref("hello").simulate("click");
  });

  it("should perform a search if you click on a non-default engine with a search string provided", done => {
    const props = {
      dispatch: action => {
        if (action.type === "NOTIFY_PERFORM_SEARCH") {
          assert.equal(action.data.searchString, "hello");
          assert.equal(action.data.engineName, "Yahoo");
          done();
        }
      },
      searchString: "hello",
      currentEngine: {name: "Google"},
      engines: [{name: "Google"}, {name: "Yahoo"}]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to -1 since we
    // want to search our own string. Click on an engine that is NOT the current search
    // engine.
    wrapper.setState({focus: true, activeSuggestionIndex: -1, activeIndex: -1, activeEngineIndex: -1});
    wrapper.ref("Yahoo").simulate("click");
  });

  it("should keep the drop down visible and display the original search string when no suggestion is selected", () => {
    const props = {
      searchString: "h",
      suggestions: ["hello", "hi"]
    };
    setup(props);
    // make sure the drop down is 'visible', set the active suggestion to the first
    // available suggestion, and move up one time.
    wrapper.setState({focus: true, activeSuggestionIndex: 0, activeIndex: 0});
    wrapper.ref("searchInput").simulate("keyDown", {key: "ArrowUp"});
    // the drop down should still be visible, but we want to display the original search string
    // and reset all the indices to -1
    assert.equal(wrapper.state("focus"), true);
    assert.equal(wrapper.state("searchString"), "h");
    assert.equal(wrapper.state("activeSuggestionIndex"), -1);
    assert.equal(wrapper.state("activeIndex"), -1);
  });
});
