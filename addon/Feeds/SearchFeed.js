const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");
const getCurrentBrowser = require("addon/lib/getCurrentBrowser");
const {Cu} = require("chrome");

module.exports = class SearchFeed extends Feed {

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

  /**
   * getSuggestions - Retrieves search suggestions for a search string (action.data)
   *                  Dispatches an array of suggestions.
   */
  getSuggestions(action) {
    const browser = getCurrentBrowser();
    return this.options.searchProvider.asyncGetSuggestions(browser, action.data)
      .then(suggestions => this.options.send(am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), action.workerId, true))
      .catch(e => Cu.reportError(e));
  }

  cycleCurrentEngine(action) {
    this.options.searchProvider.cycleCurrentEngine(action.data);
    const engine = this.options.searchProvider.currentEngine;
    this.options.send(am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: engine}), action.workerId);
  }

  /**
   * doSearch - Triggers a search in the current new tab, given a search string.
   */
  doSearch(action) {
    this.options.searchProvider.asyncPerformSearch(getCurrentBrowser(), action.data);
  }

  removeFormHistoryEntry(action) {
    this.options.searchProvider.removeFormHistoryEntry(getCurrentBrowser(), action.data);
  }

  manageEngines() {
    this.options.searchProvider.manageEngines(getCurrentBrowser());
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.getEngines();
        break;
      case am.type("SEARCH_ENGINES_CHANGED"):
        this.getEngines();
        break;
      case am.type("SEARCH_SUGGESTIONS_REQUEST"):
        this.getSuggestions(action);
        break;
      case am.type("NOTIFY_PERFORM_SEARCH"):
        this.doSearch(action);
        break;
      case am.type("NOTIFY_REMOVE_FORM_HISTORY_ENTRY"):
        this.removeFormHistoryEntry(action);
        break;
      case am.type("NOTIFY_MANAGE_ENGINES"):
        this.manageEngines();
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"): {
        this.cycleCurrentEngine(action);
        break;
      }
    }
  }
};
