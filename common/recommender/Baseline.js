"use strict";

const URL = require("../../addon/vendor.bundle.js").urlParse;
const getBestImage = require("../getBestImage");
const COEFFICIENTS = [0.1, 0.5, -0.2, 0.1, -0.2, -0.3, -0.6, -0.7];

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
      idf: [1, 0],
      imageCount: [1, 0],
      description: [1, 0],
      pathLength: [1, 0],
      largestImage: [1, 0],
      queryLength: [1, 0]
    };
  }

  extractFeatures(entry) {
    const urlObj = URL(entry.url);
    const host = urlObj.host;
    const occurences = this.domainCounts.get(host) || 1;

    const age = this.normalizeTimestamp(entry.lastVisitDate);
    const tf = Math.max(entry.visitCount, 1);
    const idf = Math.log(this.domainCounts.size / occurences);
    const imageCount = entry.images ? entry.images.length : 0;
    const isBookmarked = entry.bookmarkId || 0;
    const description = this.extractDescriptionLength(entry);
    const pathLength = urlObj.pathname.split("/").filter(e => e.length).length;
    const largestImage = this.extractLargestImage(entry.images);
    const queryLength = urlObj.query.length;

    const features = {age, tf, idf, imageCount, isBookmarked, description, pathLength, queryLength, largestImage};
    this.updateFeatureMinMax(features);

    return Object.assign({}, entry, {features, host});
  }

  normalize(features) {
    let delta;
    const normalizeKeys = Object.keys(this.normalizeFeatures);

    normalizeKeys.forEach(key => {
      if (this.normalizeFeatures[key][1] !== this.normalizeFeatures[key][0]) { // No division by 0.
        delta = this.normalizeFeatures[key][1] - this.normalizeFeatures[key][0];
        features[key] = (features[key] - this.normalizeFeatures[key][0]) / delta;
      }
    });
  }

  scoreEntry(entry) {
    this.normalize(entry.features);

    const {age, tf, idf, queryLength, imageCount, pathLength, description, largestImage} = entry.features;
    let score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, how often you go to the domain, number of images,
      //           length of path, length of description, size of biggest image.
      [age, tf, idf, queryLength, imageCount, pathLength, description, largestImage],
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      this.options.highlightsCoefficients || COEFFICIENTS);

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
    let newscore = score;

    if (!features.imageCount || !features.largestImage) {
      newscore *= 0.5;
    }

    if (!features.description) {
      newscore *= 0.5;
    }

    if (features.isBookmarked) {
      newscore *= 1.8;
    }

    return newscore;
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
    const keys = Object.keys(this.normalizeFeatures);
    keys.forEach(key => {
      this.normalizeFeatures[key][0] = this.selectMinValue(this.normalizeFeatures[key][0], newFeatures[key]);
      this.normalizeFeatures[key][1] = this.selectMaxValue(this.normalizeFeatures[key][1], newFeatures[key]);
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
      .sort(this.sortDescByScore);

    // Decreases score for consecutive items from the same host.
    results = this.dedupe(results);

    return results.sort(this.sortDescByScore);
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
   * Return the size of the largest image.
   * Assumes `getBestImage` returns largest image.
   */
  extractLargestImage(images) {
    const image = getBestImage(images);
    if (!image) {
      return 0;
    }

    return image.size;
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
   * @param {Number} value
   * @param {Array.<Number>} e
   * @param {Array.<Number>} c
   * @returns {Number}
   */
  decay(value, e, c) {
    let exp = e.reduce((acc, v, i) => acc + (v || 0) * c[i], 0);

    return value * Math.pow(Math.E, -exp);
  }

  sortDescByScore(a, b) {
    return b.score - a.score;
  }

  /**
   *  Decrease the score for consecutive items from the same domain.
   *  Combined with sorting by score the result is we don't see consecutive
   *  items from the same domain.
   *
   *  @param {Array} entries - scored and sorted highlight items.
   */
  dedupe(entries) {
    let penalty = 0.8;

    return entries.map((e, i, arr) => {
      if (i > 0 && arr[i - 1].host === e.host) {
        let score = e.score * penalty;
        penalty -= 0.2;
        return Object.assign({}, e, {score});
      }

      penalty = 0.8;
      return e;
    });
  }
}

exports.Baseline = Baseline;
