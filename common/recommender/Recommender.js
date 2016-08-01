"use strict";

const {Baseline} = require("./Baseline");

function Recommender(entries, history) {
  // XXX Based on currently running experiments this could include
  // a mechanism of choosing different recommendation systems.
  let recommender = new Baseline(history);

  return recommender.score(entries);
}

exports.Recommender = Recommender;
