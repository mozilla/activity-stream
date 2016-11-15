const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");

module.exports = class SearchFeed extends Feed {

  /**
   * getUIStrings - Dispatches an action that contains all the strings for Search UI
   */
  getUIStrings() {
    const strings = this.options.searchProvider.searchSuggestionUIStrings;
    this.store.dispatch({type: "SEARCH_UISTRINGS_RESPONSE", data: strings});
  }

  /**
   * getEngines - Dispatches an action that contains all the search engines,
   *              e.g. Google, Yahoo, etc.
   */
  getEngines() {
    const state = {
      engines: this.options.searchProvider.currentState.engines,
      currentEngine: JSON.stringify(this.options.searchProvider.currentState.currentEngine)
    };
    this.store.dispatch({type: "SEARCH_STATE_UPDATED", data: state});
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // Note: UI strings are hard-coded right now, so they only need to be refreshed on init
        this.getUIStrings();
        this.getEngines();
        break;
      case am.type("SEARCH_ENGINES_CHANGED"):
        this.getEngines();
        break;
    }
  }
};
