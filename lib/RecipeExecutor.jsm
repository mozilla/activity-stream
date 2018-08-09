/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.RecipeExecutor = class RecipeExecutor {
  constructor(tfidfVectorizer) {
    this.tfidfVectorizer = tfidfVectorizer;
  }

  /**
   * Simply appends all the strings from a set fields together. If the field
   * is a list, then the cells of the list are append.
   */
  _assembleText(item, fields) {
    let textArr = [];
    for (let i = 0; i < fields.length; i++) {
      if (fields[i] in item) {
        if (typeof item[fields[i]] === "string") {
          textArr.push(item[fields[i]]);
        } else if ((typeof item[fields[i]] === "object") &&
            Array.isArray(item[fields[i]])) {
          for (let j = 0; j < item[fields[i]].length; j++) {
            textArr.push(item[fields[i]][j]);
          }
        } else {
          textArr.push(String(item[fields[i]]));
        }
      }
    }
    return textArr.join(" ");
  }

  /**
   * Checks a field's value against another value (either from another field
   * or a constant). If the test passes, then the item is emitted, otherwise
   * the pipeline is aborted.
   *
   * Config:
   *  field      Field to read the value to test. Left side of operator.
   *  op         one of ==, !=, <, <=, >, >=
   *  rhsValue   Constant value to compare against. Right side of operator.
   *  rhsField   Field to read value to compare against. Right side of operator.
   *
   * NOTE: rhsValue takes precidence over rhsField.
   */
  acceptItemByFieldValue(item, config) {
    if (!(config.field in item)) {
      return null;
    }
    let rhs = null;
    if ("rhsValue" in config) {
      rhs = config.rhsValue;
    } else if (("rhsField" in config) && (config.rhsField in item)) {
      rhs = item[config.rhsField];
    }
    if (rhs === null) {
      return null;
    }

    // eslint-disable-next-line eqeqeq
    if (((config.op === "==") && (item[config.field] == rhs)) ||
        // eslint-disable-next-line eqeqeq
        ((config.op === "!=") && (item[config.field] != rhs)) ||
        ((config.op === "<") && (item[config.field] < rhs)) ||
        ((config.op === "<=") && (item[config.field] <= rhs)) ||
        ((config.op === ">") && (item[config.field] > rhs)) ||
        ((config.op === ">=") && (item[config.field] >= rhs))) {
      return item;
    }

    return null;
  }

  /**
   * Splits a URL into text-like tokens.
   *
   * Config:
   *  field   Field containing a URL
   *  dest    Field to write the tokens to as an array of strings
   *
   * NOTE: Any initial 'www' on the hostname is removed.
   */
  tokenizeUrl(item, config) {
    if (config.field in item) {
      let url = new URL(item[config.field]);
      let domain = url.hostname;
      if (domain.startsWith("www.")) {
        domain = domain.substring(4);
      }
      let toks = this.tfidfVectorizer.tokenize(domain);
      let pathToks =  this.tfidfVectorizer.tokenize(decodeURIComponent(url.pathname.replace(/\+/g, " ")));
      for (let i = 0; i < pathToks.length; i++) {
        toks.push(pathToks[i]);
      }
      for (let pair of url.searchParams.entries()) {
        let k = this.tfidfVectorizer.tokenize(decodeURIComponent(pair[0].replace(/\+/g, " ")));
        for (let i = 0; i < k.length; i++) {
          toks.push(k[i]);
        }
        if ((pair[1] !== null) && (pair[1] !== "")) {
          let v = this.tfidfVectorizer.tokenize(decodeURIComponent(pair[1].replace(/\+/g, " ")));
          for (let i = 0; i < v.length; i++) {
            toks.push(v[i]);
          }
        }
      }
      item[config.dest] = toks;
    }

    return item;
  }

  /**
   * Gets the hostname (minus any initial "www." along with the left most
   * directories on the path.
   *
   * Config:
   *  field          Field containing the URL
   *  dest           Field to write the array of strings to
   *  path_length    OPTIONAL (DEFAULT: 0) Number of leftmost subdirectories to include
   */
  getUrlDomain(item, config) {
    if (config.field in item) {
      let url = new URL(item[config.field]);
      let domain = url.hostname.toLocaleLowerCase();
      if (domain.startsWith("www.")) {
        domain = domain.substring(4);
      }
      item[config.dest] = domain;
      let pathLength = 0;
      if ("path_length" in config) {
        pathLength = config.path_length;
      }
      if (pathLength > 0) {
        item[config.dest] += url.pathname.toLocaleLowerCase().split("/")
                              .slice(0, pathLength + 1)
                              .join("/");
      }
    }

    return item;
  }

  /**
   * Splits a field into tokens.
   * Config:
   *  field         Field containing a string to tokenize
   *  dest          Field to write the array of strings to
   */
  tokenizeField(item, config) {
    if (config.field in item) {
      item[config.dest] = this.tfidfVectorizer.tokenize(item[config.field]);
    }

    return item;
  }
};

const EXPORTED_SYMBOLS = ["RecipeExecutor"];
