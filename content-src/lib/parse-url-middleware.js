const urlParse = require("url-parse");
const am = require("actions/action-manager");

module.exports = () => next => action => {

  if (!am.ACTIONS_WITH_SITES.has(action.type)) {
    return next(action);
  }

  if (action.error || !action.data || !action.data.length) {
    return next(action);
  }

  const data = action.data.map(site => {
    if (!site.url) {
      return site;
    }
    const parsedUrl = urlParse(site.url, true);
    if (!parsedUrl) {
      return null;
    }
    return Object.assign({}, site, {parsedUrl});
  }).filter(item => item);

  next(Object.assign({}, action, {data}));
};
