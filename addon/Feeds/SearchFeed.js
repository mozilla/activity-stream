const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");

module.exports = class SearchFeed extends Feed {
  getUIStrings() {
    const strings = this.options.searchProvider.searchSuggestionUIStrings;
    this.store.dispatch({type: "SEARCH_UISTRINGS_RESPONSE", data: strings});
  }

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
      case am.type("OPEN_NEW_TAB"):
      case am.type("SEARCH_CURRENT_ENGINE_UPDATED"):
        this.getEngines();
        break;
    }
  }
};
