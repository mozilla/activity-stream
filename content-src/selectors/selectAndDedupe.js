const dedupe = require("lib/dedupe");

/**
 * Dedupe items and appends defaults if result length is smaller than required.
 *
 * @param {Array} group
 * @param {Array} group.sites - sites to process.
 * @param {Array} group.dedupe - sites to dedupe against.
 * @param {Number} group.max - required number of items.
 * @param {Array} group.defaults - default values to use.
 * @returns {Array}
 */
module.exports = function selectAndDedupe(group) {
  return group.reduce((result, options, index, arr) => {
    let current;
    if (result.length) {
      const previous = result.reduce((prev, current) => prev.concat(current), []);
      current = dedupe.group([previous, options.sites])[1];
    } else {
      current = dedupe.one(options.sites);
    }
    if (options.defaults) {
      current = current.concat(options.defaults);
    }
    if (options.max && current.length > options.max) {
      current = current.slice(0, options.max);
    }
    result.push(current);
    return result;
  }, []);
};
