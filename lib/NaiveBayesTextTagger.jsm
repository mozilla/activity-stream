/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.NaiveBayesTextTagger = class NaiveBayesTextTagger {
  constructor(model, tokenizer) {
    this.model = model;
    this.tokenizer = tokenizer;
  }

  /**
   * Determines if the text belongs to class according to binary naive Bayes
   * classifier. Returns an object containing the class label ("label"), and
   * the log probability ("logProb") that the text belongs to that class. If
   * the positive class is more likely, then "label" is the positive class
   * label. If the negative class is matched, then "label" is set to null.
   */
  tag(text) {
    let fv = this.tokenizer.getTfIdfVector(text, this.model.vocab_idfs);

    let bestLogProb = null;
    let bestClassId = -1;
    let bestClassLabel = null;
    let logSumExp = 0.0; // will be P(x). Used to create a proper probability
    for (let classId = 0; classId < this.model.classes.length; classId++) {
      let classModel = this.model.classes[classId];
      let classLogProb = classModel.log_prior;

      // dot fv with the class model
      let fve = Object.values(fv);
      for (let i = 0; i < fve.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        let [termId, tfidf] = fve[i];
        classLogProb += tfidf * classModel.feature_log_probs[termId];
      }

      if ((bestLogProb === null) || (classLogProb > bestLogProb)) {
        bestLogProb = classLogProb;
        bestClassId = classId;
      }
      logSumExp += Math.exp(classLogProb);
    }

    // now normalizae the probability by dividing by P(x)
    logSumExp = Math.log(logSumExp);
    bestLogProb -= logSumExp;
    if (bestClassId === this.model.positive_class_id) {
      bestClassLabel = this.model.positive_class_label;
    } else {
      bestClassLabel = null;
    }

    let confident = ((bestClassId === this.model.positive_class_id) &&
                      (bestLogProb > this.model.positive_class_threshold_log_prob));
    return {
      "label": bestClassLabel,
      "logProb": bestLogProb,
      "confident": confident
    };
  }
};

const EXPORTED_SYMBOLS = ["NaiveBayesTextTagger"];
