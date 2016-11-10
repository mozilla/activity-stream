const {FIRST_RUN_TYPE} = require("lib/first-run-data");

/**
 * getHighlightContextFromSite - Returns an object with details about the origin of the Highlight
 *                               and what to display in the "context" message (on the Highlight component)
 *
 * @param  {obj} site A site (with metadata)
 * @return {obj}
 *     .label {str} The message to be displayed at the bottom of the Highlight component
 *     .type {str} An indicator of the origin/type of the highlight. One of:
 *                 recommended, firstRun, bookmark, synced, open, or history
 */
module.exports = function getHighlightContextFromSite(site) {
  const result = {};

  if (site.context_message) {
    result.label = site.context_message;
  }

  if (site.recommended) {
    result.type = "recommended";
    if (site.published) {
      result.date = site.published;
    }
  } else if (site.type === FIRST_RUN_TYPE) {
    result.type = "firstRun";
  } else if (site.bookmarkDateCreated) {
    result.type = "bookmark";
    result.date = site.bookmarkDateCreated;
  // syncedFrom and isOpen are not currently implemented, but they
  // will be added in the future
  } else if (site.syncedFrom) {
    result.type = "synced";
    result.label = `Synced from ${site.syncedFrom}`;
    result.date = site.lastVisitDate;
  } else if (site.isOpen) {
    result.type = "open";
    result.date = site.lastVisitDate;
  } else {
    result.type = "history";
    result.date = site.lastVisitDate;
  }
  return result;
};
