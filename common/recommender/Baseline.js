"use strict";

const URL = require("../../addon/vendor.bundle.js").urlParse;
const {INFINITE_SCROLL_THRESHOLD} = require("../constants");
const COEFFICIENTS = [0.4, 0.7, 0.1, -0.4, -0.2, -0.1];

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
  }

  scoreEntry(entry) {
    const urlObj = URL(entry.url);
    const host = URL(entry.url).host;
    const tf = Math.max(entry.visitCount, 1);
    const idf = Math.log(this.domainCounts.size / Math.max(1, this.domainCounts.get(host)));
    const imageCount = entry.images ? entry.images.length : 0;
    const isBookmarked = entry.bookmarkId > 0 ? 1 : 0;
    const hasDescription = entry.title !== entry.description ? 1 : 0;

    const score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, url query length, number of images, is a bookmark,
      //           has description.
      [this.normalizeTimestamp(entry.lastVisitDate), entry.visitCount, urlObj.query.length,
       imageCount, isBookmarked, hasDescription],
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      this.options.highlightsCoefficients || COEFFICIENTS);

    return Object.assign({}, entry, {score}, {host});
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
    return entries.map(entry => this.scoreEntry(entry))
      .sort(this.sortDescByScore)
      .filter(this.dedupeHosts)
      .slice(0, INFINITE_SCROLL_THRESHOLD);
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

  dedupeHosts(e, idx, arr) {
    if (idx > 0 && arr[idx - 1].host === e.host) { // same host
      return 0;
    }

    return 1;
  }
}

exports.Baseline = Baseline;
