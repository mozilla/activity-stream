const am = require("actions/action-manager");
const embedlyEndpoint = __CONFIG__.EMBEDLY_ENDPOINT;

function buildQuery(items) {
  return "?" + items
    .map(item => item.url)
    .map(encodeURIComponent)
    .map(url => "urls=" + url)
    .join("&");
}

const actionsToSupplement = new Set([
  am.type("TOP_FRECENT_SITES_RESPONSE"),
  am.type("RECENT_BOOKMARKS_RESPONSE"),
  am.type("RECENT_LINKS_RESPONSE")
].map(type => am.type(type)));

module.exports = () => next => action => {
  // We don't want to add extra data if the response is an error
  if (action.error) {
    return next(action);
  }

  if (!embedlyEndpoint) {
    return next(action);
  }

  if (actionsToSupplement.has(action.type)) {
    if (!action.data.length) {
      return next(action);
    }
    const sites = action.data.filter(site => {
      return !(!site.url || /^place:/.test(site.url));
    });

    if (!sites.length) {
      return next(action);
    }

    fetch(embedlyEndpoint + buildQuery(sites))
      .then(response => response.json())
      .then(json => {
        const data = sites.map(site => {
          const details = json[site.url];
          if (!details) {
            return site;
          }
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
