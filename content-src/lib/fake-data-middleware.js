const am = require("actions/action-manager");

function buildQuery(items) {
  return items
    .map(item => item.url)
    .map(encodeURIComponent)
    .map(url => "urls=" + url)
    .join("&");
}

const actionsToSupplement = new Set([
  "TOP_FRECENT_SITES_RESPONSE",
  "RECENT_BOOKMARKS_RESPONSE"
].map(type => am.type(type)));

module.exports = () => next => action => {
  if (actionsToSupplement.has(action.type)) {
    console.log("GETTING DATA FOR " + action.type);
    if (!action.data.length) return next(action);
    fetch("http://localhost:1467/og?" + buildQuery(action.data))
      .then(response => response.json())
      .then(json => {
        const data = action.data.map((site, i) => {
          const details = json[i].data;
          if (!details.success) return site;
          return Object.assign({}, site, {
            description: details.ogDescription,
            image: details.ogImage,
            type: details.ogType
          });
        });
        const newAction = Object.assign({}, action, {data});
        next(newAction);
      })
      .catch(() => next(action));
  }
};
