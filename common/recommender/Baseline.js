"use strict";

const URL = require("../../addon/vendor.bundle.js").urlParse;
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
      idf: {min: 1, max: 0},
      imageCount: {min: 1, max: 0},
      description: {min: 1, max: 0},
      pathLength: {min: 1, max: 0},
      largestImage: {min: 1, max: 0},
      queryLength: {min: 1, max: 0}
    };

    // These are features used for adjusting the final score.
    this.adjustmentFeatures = ["isBookmarked"];

    if (!this.options.highlightsCoefficients) {
      throw new Error("Coefficients not specified");
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
    const isBookmarked = entry.bookmarkId || 0;
    const description = this.extractDescriptionLength(entry);
    const pathLength = urlObj.pathname.split("/").filter(e => e.length).length;
    const largestImage = this.extractLargestImage(entry.images);
    const queryLength = urlObj.query.length;

    const features = {age, tf, idf, imageCount, isBookmarked, description, pathLength, queryLength, largestImage};
    this.updateFeatureMinMax(features);

    return Object.assign({}, entry, {features, host});
  }

  // Adjust all values in [0, 1].
  normalize(features) {
    return Object.keys(this.normalizeFeatures).reduce((acc, key) => {
      const {min, max} = this.normalizeFeatures[key];
      if (max !== min) { // No division by 0.
        let delta = max - min;
        acc[key] = (features[key] - min) / delta;
        return acc;
      }
    }, {});
  }

  scoreEntry(entry) {
    entry.features = this.normalize(entry.features);

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
                         .sort(this.sortDescByScore);

    // Decreases score for consecutive items from the same host.
    results = this.dedupe(results);

    // Sort again after adjusting score.
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
  decay(value, features, coef) {
    // Get all available features, filter out the ones we don't use in
    // computing initial score.
    const featNames = Object.keys(features)
                        .filter(f => this.adjustmentFeatures.indexOf(f) === -1)
                        .sort();
    // Multiply feature value by weight and sum up all results.
    let exp = featNames.reduce((acc, name, i) => acc + features[name] * coef[i], 0);

    // Throw error instead of trying to fallback becase results will be wrong.
    if (Number.isNaN(exp)) {
      throw new Error("Could not compute feature score");
    }

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

    return entries.map((entry, i, arr) => {
      if (i > 0 && arr[i - 1].host === entry.host) {
        let score = entry.score * penalty;
        penalty -= 0.2;
        return Object.assign({}, entry, {score});
      }

      penalty = 0.8;
      return entry;
    });
  }
}

exports.Baseline = Baseline;
