const am = require("actions/action-manager");
const isDevServerRunning = !!__CONFIG__.API_KEY;

function buildQuery(items) {
  return items
    .map(item => item.url)
    .map(encodeURIComponent)
    .map(url => "urls=" + url)
    .join("&");
}

const actionsToSupplement = new Set([
  "TOP_FRECENT_SITES_RESPONSE",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECENT_LINKS_RESPONSE"
].map(type => am.type(type)));

module.exports = () => next => action => {
  // We don't want to add extra data if the response is an error
  if (action.error) {
    return next(action);
  }
  // We can't fetch extra data if the embedly server is not running
  if (!isDevServerRunning) {
    return next(action);
  }
  if (actionsToSupplement.has(action.type)) {
    if (!action.data.length) {
      return next(action);
    }
    fetch("http://localhost:1467/extract?" + buildQuery(action.data))
      .then(response => response.json())
      .then(json => {
        const data = action.data.map((site, i) => {
          const details = json[i];
          return Object.assign({}, site, {
            description: details.description,
            title: details.title,
            images: details.images,
            favicon_url: details.favicon_url,
            favicon_colors: details.favicon_colors,
            media: details.media,
            provider_name: details.provider_name
          });
        });
        const newAction = Object.assign({}, action, {data});
        next(newAction);
      })
      .catch(() => next(action));
  } else {
    next(action);
  }
};
