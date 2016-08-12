"use strict";

const URL = require("../../lib/vendor.bundle.js").urlParse;
const {INFINITE_SCROLL_THRESHOLD} = require("../constants");

/**
 * Score function for URLs.
 * See tests and `scoreEntry` comments for more insight into how the score is computed.
 *
 * @param {Array.<URLs>} history - User history used to assign higher score to popular domains.
 */
class Baseline {
  constructor(history) {
    this.domainCounts = history.reduce(this.countDomainOccurrences, new Map());
  }

  scoreEntry(entry) {
    let urlObj = URL(entry.url);
    let host = URL(entry.url).host;
    let tf = Math.max(entry.visitCount, 1);
    let idf = Math.log(this.domainCounts.size / Math.max(1, this.domainCounts.get(host)));
    let imageCount = entry.images ? entry.images.length : 0;
    let isBookmarked = entry.bookmarkId > 0 ? 1 : 0;
    let hasDescription = entry.title !== entry.description ? 1 : 0;

    let score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, url query length, number of images, is a bookmark,
      //           has description.
      [this.normalizeTimestamp(entry.lastVisitDate), entry.visitCount, urlObj.query.length,
       imageCount, isBookmarked, hasDescription],
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      [0.4, 0.7, 0.1, -0.4, -0.2, -0.1]);

    return Object.assign({}, entry, {score}, {host});
  }

  /**
   * Scoring function for an array of URLs.
   *
   * @param {Array.<URLs>} entries
   * @returns {Array.<URLs>} sorted and with the associated score value.
   */
  score(entries) {
    return entries.map(e => this.scoreEntry(e))
      .filter(e => e.score > 0)
      .sort(this.sortDescByScore)
      .filter(this.dedupHosts)
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
    let host = entry.reversedHost.split("").reverse().join("").slice(1); // moc.buhtig. => github.com
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
    let exp = e.reduce(function(acc, v, i) {
      return acc + v * c[i];
    }, 0);

    return value * Math.pow(Math.E, -exp);
  }

  sortDescByScore(a, b) {
    return b.score - a.score;
  }

  dedupHosts(e, idx, arr) {
    if (idx > 0 && arr[idx - 1].host === e.host) { // same host
      return 0;
    }

    return 1;
  }
}

exports.Baseline = Baseline;
