const dedupe = require("fancy-dedupe");

dedupe.defaults.createKey = site => site.cache_key || site.hostname || site.url;

/**
 * Dedupe items and appends defaults if result length is smaller than required.
 *
 * @param {Array} group
 * @param {Array} group.sites - sites to process.
 * @param {Number} group.max - required number of items.
 * @param {Array} group.defaults - default values to use.
 * @returns {Array}
 */
module.exports = function selectAndDedupe(group) {
  return group.reduce((result, options, index, arr) => {
    let current;
    let sites = options.defaults ? options.sites.concat(options.defaults) : options.sites;
    if (result.length) {
      const previous = result.reduce((prev, item) => prev.concat(item), []);
      current = dedupe.group([previous, sites])[1];
    } else {
      current = dedupe.one(sites);
    }
    if (options.max && current.length > options.max) {
      current = current.slice(0, options.max);
    }
    result.push(current);
    return result;
  }, []);
};
