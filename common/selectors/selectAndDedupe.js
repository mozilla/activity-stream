const dedupe = require("fancy-dedupe");

/**
 * Dedupe items and appends defaults if result length is smaller than required.
 *
 * @param {Array} group
 * @param {Array} group.sites - sites to process.
 * @param {Number} group.max - required number of items.
 * @param {Array} group.defaults - default values to use.
 * @returns {Array}
 */
module.exports.selectAndDedupe = function selectAndDedupe(group) {
  return group.reduce((result, options, index, arr) => {
    let current;
    let sites = options.sites;

    // NOTE: The Math.random() fallback is because there can be empty slots thanks to pinning
    // with a limited history.
    dedupe.defaults.createKey = site => (site ? site.cache_key || site.hostname || site.url : Math.random());

    if (options.defaults) {
      // Dedupe the defaults first.
      let defaults = dedupe.group([sites, options.defaults])[1];
      // Fill in any empty slots with default sites.
      sites.forEach((site, i) => {
        if (!site) {
          sites[i] = defaults.shift();
        }
      });
      // Then concatenate the rest.
      sites = sites.concat(options.defaults);
    }

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

module.exports.dedupeOne = list => {
  dedupe.defaults.createKey = site => (site ? site.hostname : Math.random());

  return dedupe.one(list);
};
