"use strict";

const URL = require("../../addon/vendor.bundle.js").urlParse;
const {INFINITE_SCROLL_THRESHOLD} = require("../constants");
const getBestImage = require("../getBestImage");
const COEFFICIENTS = [0.4, 0.7, -0.2, 0.1, -0.5, -0.3, -0.8, -0.6, -0.7];

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
    this.features = {
      idf: [1, 0],
      imageCount: [1, 0],
      description: [1, 0],
      pathLength: [1, 0],
      largestImage: [1, 0],
      queryLength: [1, 0]
    }
  }

  extractFeatures(entry) {
    const urlObj = URL(entry.url);
    const host = urlObj.host;
    const occurences = this.domainCounts.get(host) || 1;

    const age = this.normalizeTimestamp(entry.lastVisitDate);
    const tf = Math.max(entry.visitCount, 1);
    const idf = Math.log(this.domainCounts.size / occurences);
    const imageCount = entry.images ? entry.images.length : 0;
    const isBookmarked = entry.bookmarkId > 0 ? 1 : 0;
    const description = entry.description ? entry.description.length : 0;
    const pathLength = urlObj.pathname.split("/").filter(e => e.length).length;
    const largestImage = this.extractLargestImage(entry);
    const queryLength = urlObj.query.length;

    const features = {age, tf, idf, imageCount, isBookmarked, description, pathLength, queryLength, largestImage};
    this.updateFeatureMinMax(features);

    return Object.assign({}, entry, {features, host});
  }

  normalizeFeatures(features) {
    const normalizeKeys = Object.keys(this.features);
    normalizeKeys.forEach(key => {
      if (this.features[key][1] !== this.features[key][0]) { // No division by 0.
        features[key] = (features[key] - this.features[key][0]) / (this.features[key][1] - this.features[key][0]);
      }
    });
  }

  scoreEntry(entry) {
    this.normalizeFeatures(entry.features);
    const {age, tf, idf, queryLength, imageCount, pathLength, isBookmarked, description, largestImage} = entry.features;

    let score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, url query length, number of images, is a bookmark,
      //           has description.
      [age, tf, idf, queryLength, imageCount, pathLength, isBookmarked, description, largestImage],
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      this.options.highlightsCoefficients || COEFFICIENTS);

    if (!imageCount || !largestImage) {
      score *= 0.8;
    }

    return Object.assign({}, entry, {score});
  }

  updateFeatureMinMax(newFeatures) {
    const keys = Object.keys(this.features);
    keys.forEach(key => {
      this.features[key][0] = Math.min(this.features[key][0], newFeatures[key]);
      this.features[key][1] = Math.max(this.features[key][1], newFeatures[key]);
    });
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
   * XXX
   */
  extractLargestImage(entry) {
    const image = getBestImage(entry);
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
    let exp = e.reduce((acc, v, i) => acc + v * c[i], 0);

    return value * Math.pow(Math.E, -exp);
  }

  sortDescByScore(a, b) {
    return b.score - a.score;
  }

  dedupe(arr) {
    let penalty = 0.8;

    return arr.map((e, i, arr) => {
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
