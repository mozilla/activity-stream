"use strict";

const {Baseline} = require("./Baseline");

class Recommender {
  constructor(history, options = {}) {
    // XXX Based on currently running experiments this could include
    // a mechanism of choosing different recommendation systems.
    this.recommender = new Baseline(history, options);
  }

  scoreEntries(entries) {
    return this.recommender.score(entries);
  }

  updateOptions(options) {
    this.recommender.updateOptions(options);
  }
}

exports.Recommender = Recommender;
