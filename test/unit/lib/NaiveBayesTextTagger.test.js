import {NaiveBayesTextTagger} from "lib/NaiveBayesTextTagger.jsm";
import {TfIdfVectorizer} from "lib/TfIdfVectorizer.jsm";

const EPSILON = 0.00001;

describe("Naive Bayes Tagger", () => {
  describe("#tag", () => {
    let model = {
      model_type: "nb",
      positive_class_label: "military",
      positive_class_id: 0,
      positive_class_threshold_log_prob: -0.5108256237659907,
      classes: [
        {
          log_prior: -0.6881346387364013,
          feature_log_probs: [
            -6.2149425847276,
            -6.829869141665873,
            -7.124856122235796,
            -7.116661287797188,
            -6.694751331313906,
            -7.11798266787003,
            -6.5094904366004185,
            -7.1639509366900604,
            -7.218981434452414,
            -6.854842907887801,
            -7.080328841624584,
          ],
        },
        {
          log_prior: -0.6981849745899025,
          feature_log_probs: [
            -7.0575941199203465,
            -6.632333513597953,
            -7.382756370680115,
            -7.1160793981275905,
            -8.467120918791892,
            -8.369201274990882,
            -8.518506617006922,
            -7.015756380369387,
            -7.739036845511857,
            -9.748294397894645,
            -3.9353548206941955,
          ],
        },
      ],
      vocab_idfs: {
        deal:    [0,  5.5058519847862275],
        easy:    [1,  5.5058519847862275],
        tanks:   [2,  5.6011621645905520],
        sites:   [3,  5.9578371085292850],
        care:    [4,  5.9578371085292850],
        needs:   [5,  5.8243057159047620],
        finally: [6,  5.7065226802483790],
        super:   [7,  5.2646899279693390],
        heard:   [8,  5.5058519847862275],
        reached: [9,  5.9578371085292850],
        words:   [10, 5.0705339135283820],
      },
    };
    let instance = new NaiveBayesTextTagger(model, new TfIdfVectorizer());

    let testCases = [
      {
        input: "Finally! Super easy care for your tanks!",
        expected: {
          label: "military",
          logProb: -0.16299510296630082,
          confident: true,
        },
      },
      {
        input: "heard",
        expected: {
          label: "military",
          logProb: -0.4628170738373294,
          confident: false,
        },
      },
      {
        input: "words",
        expected: {
          label: null,
          logProb: -0.04258339303757985,
          confident: false,
        },
      },
    ];

    let checkTag = tc => {
      let actual = instance.tagText(tc.input);
      it(`should tag ${tc.input} with ${tc.expected.label}`, () => {
        assert.equal(tc.expected.label, actual.label);
      });
      it(`should give ${tc.input} the correct probability`, () => {
        let delta = Math.abs(tc.expected.logProb - actual.logProb);
        assert.isTrue(delta <= EPSILON);
      });
      it(`should give the same results for ${tc.input}, whether pretokenized or not`, () => {
        let textResults = instance.tagText(tc.input);
        let tokResults = instance.tagTokens(instance.tokenizer.tokenize(tc.input));
        assert.deepEqual(textResults, tokResults);
      });
    };

    // RELEASE THE TESTS!
    for (let tc of testCases) {
      checkTag(tc);
    }
  });
});
