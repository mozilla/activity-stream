const urlParse = require("common/vendor")("url-parse");
const am = require("common/action-manager");

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
    const parsedUrl = urlParse(site.url, false);
    if (!parsedUrl) {
      return null;
    }
    return Object.assign({}, site, {parsedUrl});
  }).filter(item => item);

  return next(Object.assign({}, action, {data}));
};
