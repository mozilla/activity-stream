const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");
const PAGE_NAME = "NEW_TAB";

const Search = React.createClass({
  getInitialState: function() {
    return {
      focus: false,
      activeIndex: -1,
      activeSuggestionIndex: -1,
      activeEngineIndex: -1,
      searchString: this.props.searchString
    };
  },
  resetState: function() {
    this.setState(this.getInitialState());
  },
  manageEngines: function() {
    this.props.dispatch(actions.NotifyManageEngines());
  },
  setValueAndSuggestions: function(value) {
    this.setState({activeIndex: -1, activeSuggestionIndex: -1, searchString: value});
    this.props.dispatch(actions.NotifyUpdateSearchString(value));
    this.props.dispatch(actions.RequestSearchSuggestions({engineName: this.props.currentEngine.name, searchString: value}));
  },
  getActiveSuggestion: function() {
    const suggestions = this.props.formHistory.concat(this.props.suggestions);
    const index = this.state.activeSuggestionIndex;
    return (suggestions && suggestions.length && index >= 0) ? suggestions[index] : null;
  },
  getActiveEngine: function() {
    const index = this.state.activeEngineIndex;
    return (index >= 0) ? this.props.engines[index].name : this.props.currentEngine.name;
  },
  getSettingsButtonIsActive: function() {
    const index = this.state.activeIndex;
    const numSuggestions = this.props.formHistory.concat(this.props.suggestions).length;
    const numEngines = this.props.engines.length;
    return index === numSuggestions + numEngines;
  },
  getActiveDescendantId: function() {
    // Returns the ID of the element being currently in focus, if any.
    const index = this.state.activeIndex;
    const numSuggestions = this.props.formHistory.concat(this.props.suggestions).length;
    const numEngines = this.props.engines.length;
    if (index < numSuggestions) {
      return "search-suggestions-" + "history-search-suggestions-" + index;
    } else if (index < numSuggestions + numEngines) {
      return "search-partners-" + (index - numSuggestions);
    } else if (index === numSuggestions + numEngines) {
      return "search-settings-button";
    }
    return null;
  },
  getDropdownVisible: function() {
    return !!(this.props.searchString && this.state.focus);
  },
  performSearch: function(options) {
    let searchData = {
      engineName: options.engineName,
      searchString: options.searchString,
      searchPurpose: "d"
    };
    this.props.dispatch(actions.NotifyPerformSearch(searchData));
    this.props.dispatch(actions.NotifyEvent({
      event: "SEARCH",
      page: PAGE_NAME
    }));
  },
  removeFormHistory: function(suggestion) {
    this.props.dispatch(actions.NotifyRemoveFormHistory(suggestion));
  },
  cycleCurrentEngine: function(index) {
    this.props.dispatch(actions.NotifyCycleEngine(this.props.engines[index].name));
  },
  handleKeyPress: function(e) {
    // Handle the keyboard navigation of the widget.

    // If the dropdown isn't visible, we don't handle the event.
    if (!this.getDropdownVisible()) {
      return;
    }

    const index = this.state.activeIndex;
    const numEngines = this.props.engines.length;
    const originalSearchString = this.state.searchString;
    const suggestions = this.props.formHistory.concat(this.props.suggestions);
    let numSuggestions = this.props.formHistory.concat(this.props.suggestions).length;
    let newIndex = index;
    let newSuggestionIndex = this.state.activeSuggestionIndex;
    let newEngineIndex = this.state.activeEngineIndex;
    switch (e.key) {
      case "ArrowDown":
        if (index < numSuggestions + numEngines) {
          newIndex++;
          if (index < numSuggestions - 1) {
            // We are in suggestions, move down until the last one.
            newSuggestionIndex++;
            this.props.dispatch(actions.NotifyUpdateSearchString(suggestions[newSuggestionIndex]));
          } else if (index === numSuggestions - 1) {
            // We are on the last suggestion, reset suggestion index and
            // start on the engine index.
            this.props.dispatch(actions.NotifyUpdateSearchString(originalSearchString));
            newSuggestionIndex = -1;
            newEngineIndex++;
          } else if (index < numSuggestions + numEngines - 1) {
            // We are in engines, keep going until the last one.
            newEngineIndex++;
            if (e.metaKey && e.altKey) {
              this.cycleCurrentEngine(newEngineIndex);
            }
          } else if (index === numSuggestions + numEngines - 1) {
            // We are on the last engine, reset engine index.
            newEngineIndex = -1;
          }
        } else {
          // We reached the end. Reset to -1.
          newIndex = -1;
        }
        break;
      case "ArrowUp":
        if (index > -1) {
          newIndex--;

          // if we've reached the top of the suggestions list and press 'up' once more,
          // we keep the table visible but display the origial search string. This
          // behaviour is meant to match about:newtab
          if (newIndex === -1) {
            this.setState({focus: true});
            this.props.dispatch(actions.NotifyUpdateSearchString(originalSearchString));
            newSuggestionIndex = -1;
            newIndex = -1;
            break;
          }
          if (index < numSuggestions) {
            // We are in suggestions, move on up.
            newSuggestionIndex--;
            this.props.dispatch(actions.NotifyUpdateSearchString(suggestions[newSuggestionIndex]));
          } else if (index === numSuggestions) {
            // We are on the first engine, reset engine index and move to
            // last suggestion.
            newEngineIndex = -1;
            newSuggestionIndex = numSuggestions - 1;
            this.props.dispatch(actions.NotifyUpdateSearchString(suggestions[newSuggestionIndex]));
          } else if (index < numSuggestions + numEngines) {
            // We are on the engine list, move on up.
            newEngineIndex--;
            if (e.metaKey && e.altKey) {
              this.cycleCurrentEngine(newEngineIndex);
            }
          } else {
            // We are on the button, move to last engine.
            newEngineIndex = numEngines - 1;
          }
        } else {
          // Nothing is selected, go to the very end.
          newIndex = numSuggestions + numEngines;
        }
        break;
      case "Tab":
        // Tab only navigates through the engines list.
        if (!e.shiftKey) {
          // Shift isn't pressed, go forward.
          if (index === numSuggestions + numEngines) {
            // We reached the end, let the event go on.
            return;
          }
          if (index < numSuggestions) {
            // We aren't in the engines list yet, move to first engine.
            newIndex = numSuggestions;
            newEngineIndex = 0;
          } else {
            // We are in the engines list, move along.
            newIndex++;
            newEngineIndex++;
          }
        } else {
          // Shift is pressed, go backward.
          if (index < numSuggestions) {
            // We aren't on the engines list, ;et the event move on.
            return;
          }
          if (index === numSuggestions) {
            // We are on the first engine, unselect it and go to where we were
            // in the suggestions list.
            newEngineIndex = -1;
            newIndex = newSuggestionIndex;
          } else if (index < numSuggestions + numEngines) {
            // We are in the engines list, move up the list.
            newIndex--;
            newEngineIndex--;
          } else {
            // We are on the button, go to bottom of engine list.
            newIndex--;
            newEngineIndex = numEngines - 1;
          }
        }
        break;
      case "Delete":
        // This is the case where the user deletes a form history entry from the dropdown
        // You can only delete form history entries, so check that the active suggestion is
        // a form history entry.
        if (this.props.formHistory.includes(suggestions[newSuggestionIndex])) {
          // Remove it, update your form history list and your list of suggestions.
          this.removeFormHistory(suggestions[newSuggestionIndex]);
          this.props.formHistory.splice(newSuggestionIndex, 1);
          suggestions.splice(newSuggestionIndex, 1);
          // Update your suggestion index, and the number of suggestions shown.
          newSuggestionIndex = -1;
          newIndex = -1;
          numSuggestions--;
        }
        this.setState({
          activeIndex: newIndex,
          activeSuggestionIndex: newSuggestionIndex,
          activeEngineIndex: newEngineIndex
        });
        return;
      case "Enter":
        e.preventDefault();
        // If the change settings button is selected, fire the action for it.
        if (this.getSettingsButtonIsActive()) {
          this.manageEngines();
          return;
        }
        this.performSearch({
          engineName: this.getActiveEngine(),
          searchString: this.getActiveSuggestion() || this.props.searchString
        });
        return;
      default:
        return;
    }

    e.preventDefault();
    this.setState({
      activeIndex: newIndex,
      activeSuggestionIndex: newSuggestionIndex,
      activeEngineIndex: newEngineIndex
    });
  },

  onMouseMove(newIndex) {
    this.setState({
      activeIndex: newIndex,
      activeSuggestionIndex: newIndex,
    });
  },
  render() {
    const {currentEngine, searchString, suggestions, formHistory, engines} = this.props;
    let suggestionsIdIndex = 0;
    let enginesIdIndex = 0;

    return (<form className="search-wrapper">
      <span className="search-label" />
      <input ref="searchInput" type="search"
        value={searchString} maxLength="256"
        aria-expanded={this.getDropdownVisible()}
        aria-activedescendant={this.getActiveDescendantId()} autoComplete="off"
        placeholder={this.props.searchPlaceholder}
        onFocus={() => this.setState({focus: true})}
        onChange={e => this.setValueAndSuggestions(e.target.value)}
        onKeyDown={e => this.handleKeyPress(e)}
        onBlur={() => setTimeout(() => this.resetState(), 200)}/>
      <button ref="performSearchButton"
        onClick={e => { e.preventDefault(); this.performSearch({engineName: currentEngine.name, searchString});}}>
        <span className="sr-only">Search</span>
      </button>
      <div className="search-container" role="presentation" hidden={!this.getDropdownVisible()}>
      <section className="search-title" hidden={!formHistory.concat(suggestions).length}>
        <img id="current-engine-icon" src={currentEngine.iconBuffer} alt={currentEngine.name.charAt(0)} width="16px" height="16px"/>
        {this.props.searchHeader.replace("%S", currentEngine.name)}
      </section>
      <section className="history-search-suggestions" hidden={!formHistory.length}>
        <ul ref="formHistoryList" role="listbox">
          {formHistory.map(suggestion => {
            const active = (this.state.activeSuggestionIndex === suggestionsIdIndex);
            const activeEngine = this.getActiveEngine();
            const suggestionIndex = suggestionsIdIndex++;
            return (<li key={suggestion} role="option">
                  <a id={"history-search-suggestions-" + suggestionsIdIndex++ }
                     onMouseMove={() => this.onMouseMove(suggestionIndex)}
                     className={active ? "active" : ""} role="option"
                     aria-selected={active} onClick={() => this.performSearch({engineName: activeEngine, searchString: suggestion})}>
                     <div id="historyIcon" className={active ? "active" : ""}></div>{suggestion}</a>
                </li>);
          })}
        </ul>
      </section>
      <section className="search-suggestions" hidden={!suggestions.length}>
        <ul ref="suggestionsList" role="listbox">
          {suggestions.map(suggestion => {
            const active = (this.state.activeSuggestionIndex === suggestionsIdIndex);
            const activeEngine = this.getActiveEngine();
            const suggestionIndex = suggestionsIdIndex++;
            return (<li key={suggestion} role="option">
            <a ref={suggestion} id={"search-suggestions-" + suggestionIndex }
              onMouseMove={() => this.onMouseMove(suggestionIndex)}
              className={active ? "active" : ""} role="option"
              aria-selected={active}
              onClick={() => this.performSearch({engineName: activeEngine, searchString: suggestion})}>{suggestion}</a>
            </li>);
          })}
        </ul>
      </section>
      <section className="search-title">
        <p>{this.props.searchForSomethingWith}<span><b> {searchString} </b></span>with:</p>
      </section>
      <section className="search-partners" role="group">
            <ul>
            {engines.map(option => {
              const icon = option.icon;
              const active = (this.state.activeEngineIndex === enginesIdIndex);
              return (<li key={option.name} className={active ? "active" : ""}>
                <a ref={option.name} id={"search-partners-" + enginesIdIndex++ } aria-selected={active}
                      onClick={() => this.performSearch({engineName: option.name, searchString: this.getActiveSuggestion() || searchString})}>
                <img src={icon} alt={option.name} width="16" height="16"/></a>
              </li>);
            })}
            </ul>
        </section>
        <section className="search-settings">
          <button id="search-settings-button" ref="searchSettingsButton"
            className={this.getSettingsButtonIsActive() ? "active" : ""}
            aria-selected={this.getSettingsButtonIsActive()}
            onClick={(e) => {
              e.preventDefault();
              this.manageEngines();
            }}>{this.props.searchSettings}
          </button>
        </section>
      </div>
    </form>);
  }
});

function select(state) {
  return state.Search;
}

module.exports = connect(select)(Search);
module.exports.Search = Search;
