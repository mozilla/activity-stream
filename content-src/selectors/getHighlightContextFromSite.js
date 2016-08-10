const {FIRST_RUN_TYPE} = require("lib/first-run-data");

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
