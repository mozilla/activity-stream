"use strict";

const {BOOKMARK_AGE_DIVIDEND} = require("common/constants");
const URL = require("common/vendor")("url-parse");
const getBestImage = require("../getBestImage");

/**
 * Score function for URLs.
 * See tests and `scoreEntry` comments for more insight into how the score is computed.
 *
 * @param {Array.<URLs>} history - User history used to assign higher score to popular domains.
 * @param {Object} options - settings for the scoring function.
 */
class Baseline {
  constructor(history, options = {}) {
    this.domainCounts = history.reduce(this.countDomainOccurrences, new Map());
    this.options = options;
    // Features that are extracted from URLs and need normalization.
    // Key 0 holds the min, key 1 holds max, using arrays for brevity.
    this.normalizeFeatures = {
      description: {min: 1, max: 0},
      pathLength: {min: 1, max: 0},
      image: {min: 1, max: 0}
    };

    // These are features used for adjusting the final score.
    // Used by decay function to filter out features.
    this.adjustmentFeatures = ["bookmarkAge", "imageCount", "age", "idf"];

    if (!this.options.highlightsCoefficients) {
      throw new Error("Coefficients not specified");
    }
  }

  extractFeatures(entry) {
    const urlObj = URL(entry.url);
    const host = urlObj.host;
    // For empty profiles.
    const occurrences = this.domainCounts.get(host) || 1;
    const domainCountsSize = this.domainCounts.size || 1;
    const tf = entry.visitCount || 1;
    const idf = Math.log(1 + domainCountsSize / occurrences);

    const age = this.normalizeTimestamp(entry.lastVisitDate);
    const imageCount = entry.images ? entry.images.length : 0;
    const description = this.extractDescriptionLength(entry);
    const pathLength = urlObj.pathname.split("/").filter(e => e.length).length;
    const image = this.extractImage(entry.images);
    const queryLength = urlObj.query.length;

    // For bookmarks, compute a positive age in milliseconds; otherwise default 0
    const bookmarkAge = entry.bookmarkDateCreated ? Math.max(1, Date.now() - entry.bookmarkDateCreated) : 0;

    const features = {age, tf, idf, imageCount, bookmarkAge, description, pathLength, queryLength, image};
    this.updateFeatureMinMax(features);

    return Object.assign({}, entry, {features, host});
  }

  // Adjust all values in the range [0, 1].
  normalize(features) {
    return Object.keys(this.normalizeFeatures).reduce((acc, key) => {
      const {min, max} = this.normalizeFeatures[key];
      if (max > min) { // No division by 0.
        let delta = max - min;
        acc[key] = (features[key] - min) / delta;
      }

      return acc;
    }, Object.assign({}, features));
  }

  scoreEntry(entry) {
    entry.features = this.normalize(entry.features);

    // Initial score based on visits and number of occurrences of the domain.
    const {tf, idf} = entry.features;
    let score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, how often you go to the domain, number of images,
      //           length of path, length of description, size of biggest image.
      entry.features,
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      this.options.highlightsCoefficients);

    score = this.adjustScore(score, entry.features);

    return Object.assign({}, entry, {score});
  }

  /**
   * Extra penalty/reward we want to adjust the score by.
   *
   * @param {Number} score - initial value.
   * @param {Object} features - associated features and their values.
   */
  adjustScore(score, features) {
    let newScore = score;

    newScore /= Math.pow(1 + features.age, 2);

    if (!features.imageCount || !features.image) {
      newScore = 0;
    }

    if (!features.description || !features.pathLength) {
      newScore *= 0.2;
    }

    // Boost boomarks even if they have low score or no images giving a
    // just-bookmarked page a near-infinite boost
    if (features.bookmarkAge) {
      newScore += BOOKMARK_AGE_DIVIDEND / features.bookmarkAge;
    }

    return newScore;
  }

  extractDescriptionLength(entry) {
    if (!entry.description ||
        entry.title === entry.description ||
        entry.url === entry.description) {
      return 0;
    }

    return entry.description.length;
  }

  /**
   * Update min and max values of the features that require normalization.
   *
   * @param {Object} newFeatures - features and associated values.
   */
  updateFeatureMinMax(newFeatures) {
    Object.keys(this.normalizeFeatures).forEach(key => {
      this.normalizeFeatures[key].min = this.selectMinValue(this.normalizeFeatures[key].min, newFeatures[key]);
      this.normalizeFeatures[key].max = this.selectMaxValue(this.normalizeFeatures[key].max, newFeatures[key]);
    });
  }

  /**
   * Guard against undefined values that cause Math.{min, max} to return NaN.
   */
  selectMaxValue(oldv, newv) {
    const value = Math.max(oldv, newv);
    if (Number.isNaN(value)) {
      return oldv;
    }

    return value;
  }

  selectMinValue(oldv, newv) {
    const value = Math.min(oldv, newv);
    if (Number.isNaN(value)) {
      return oldv;
    }

    return value;
  }

  updateOptions(options) {
    this.options = options;
  }

  /**
   * Scoring function for an array of URLs.
   *
   * @param {Array.<URLs>} entries
   * @returns {Array.<URLs>} sorted and with the associated score value.
   */
  score(entries) {
    let results = entries.map(entry => this.extractFeatures(entry))
                    .map(entry => this.scoreEntry(entry))
                    .sort(this.sortDescByScore)
                    .filter(entry => entry.score > 0);

    // Decreases score for similar consecutive items and remove duplicates
    results = this._adjustConsecutiveEntries(results);
    let dedupedEntries = this._dedupeSites(results);

    // Sort again after adjusting score.
    return dedupedEntries.sort(this.sortDescByScore);
  }

  /**
   * Reduce user history to a map of hosts and number of visits
   *
   * @param {Map.<string, number>} result - Accumulator
   * @param {Object} entry
   * @returns {Map.<string, number>}
   */
  countDomainOccurrences(result, entry) {
    let host = entry.reversedHost
                    .split("")
                    .reverse()
                    .join("")
                    .slice(1); // moc.buhtig. => github.com
    result.set(host, entry.visitCount);

    return result;
  }

  /**
   * Return the size of the image.
   * Assumes `getBestImage` returns the best image it has.
   * @param {Array} images
   * @returns {Number}
   */
  extractImage(images) {
    const image = getBestImage(images);

    // Sanity check: validate that an image exists and we have dimensions before trying to compute size.
    if (!image || !image.width || !image.height) {
      return 0;
    }

    return Math.min(image.width * image.height, 1e5);
  }

  /**
   * @param {Number} value
   * @returns {Number}
   */
  normalizeTimestamp(value) {
    if (!value) {
      return 0;
    }

    let r = (Date.now() - value) / (1e3 * 3600 * 24);
    return parseFloat(r.toFixed(4));
  }

  /**
   * @param {Number} value - initial score based on frequency.
   * @param {Object} features - object of features and associated values for a URL.
   * @param {Array.<Number>} coef - weights
   * @returns {Number}
   */
  decay(value, features, coef) {
    // Get all available features, filter out the ones we don't use in
    // computing initial score.
    const featNames = Object.keys(features)
                        .filter(f => this.adjustmentFeatures.indexOf(f) === -1)
                        .sort();

    if (featNames.length !== coef.length) {
      throw new Error("Different number of features and weights");
    }

    // Multiply feature value by weight and sum up all results.
    let exp = featNames.reduce((acc, name, i) => acc + features[name] * coef[i], 0);

    // Throw error instead of trying to fallback because results will be wrong.
    if (Number.isNaN(exp)) {
      throw new Error("Could not compute feature score");
    }

    return value * Math.pow(Math.E, -exp);
  }

  sortDescByScore(a, b) {
    return b.score - a.score;
  }

  /**
   * Determine if two entries are similar. Used to lower the score for similar consecutive items.
   *
   * @param {Object} prev
   * @param {Object} curr
   * @returns {boolean}
   * @private
   */
  _similarItems(prev, curr) {
    const imgPrev = getBestImage(prev.images);
    const imgCurr = getBestImage(curr.images);
    const hasImage = imgPrev && imgCurr;
    return prev.host === curr.host || (hasImage && imgPrev.url === imgCurr.url);
  }

  /**
   *  Decrease the score for consecutive items which are similar (see `_similarItems`).
   *  Combined with sorting by score the result is we don't see similar consecutive
   *  items.
   *
   *  @param {Array} entries - scored and sorted highlight items.
   */
  _adjustConsecutiveEntries(entries) {
    let penalty = 0.8;

    if (entries.length < 2) {
      return entries;
    }

    entries.reduce((prev, curr) => {
      if (this._similarItems(prev, curr)) {
        curr.score *= penalty;
        penalty -= 0.2;
      } else {
        penalty = 0.8;
      }

      return curr;
    });

    return entries;
  }

  _dedupeSites(entries) {
    let dedupedEntries = new Map();
    entries.forEach(item => {
      let key = this._createDedupeKey(item);
      if (!dedupedEntries.get(key)) {
        dedupedEntries.set(key, [item]);
      }
    });

    let results = [];
    dedupedEntries.forEach(item => results.push(item[0]));
    return results;
  }

  _createDedupeKey(entry) {
    return entry.host;
  }
}

exports.Baseline = Baseline;
