const am = require("actions/action-manager");
const embedlyEndpoint = __CONFIG__.EMBEDLY_ENDPOINT;
const {urlFilter, siteFilter} = require("lib/filters");
const {innerDedupe} = require("lib/dedupe");

function buildQuery(items) {
  return "?" + items
    .map(item => item.url)
    .map(encodeURIComponent)
    .map(url => "urls=" + url)
    .join("&");
}

module.exports = () => next => action => {
  // We don't want to add extra data if the response is an error
  if (action.error) {
    return next(action);
  }

  if (!am.ACTIONS_WITH_SITES.has(action.type)) {
    return next(action);
  }

  if (!action.data.length) {
    return next(action);
  }

  const sites = innerDedupe(action.data.filter(urlFilter));

  const filteredAction = Object.assign({}, action, {data: sites});

  if (!sites.length) {
    return next(filteredAction);
  }

  if (!embedlyEndpoint) {
    return next(filteredAction);
  }

  fetch(embedlyEndpoint + buildQuery(sites))
    .then(response => response.json())
    .then(json => {

      const data = sites
        .map(site => {
          const details = json[site.url];
          if (!details) {
            return site;
          }
          return Object.assign({}, details, site);
        })
        .filter(siteFilter);

      const newAction = Object.assign({}, action, {data});
      next(newAction);
    })
    .catch(() => next(filteredAction));
};
