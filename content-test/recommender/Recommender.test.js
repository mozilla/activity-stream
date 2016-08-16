/* globals describe, it, beforeEach */

const {Recommender} = require("common/recommender/Recommender");
const {Baseline} = require("common/recommender/Baseline");
const {assert} = require("chai");

describe("recommender", () => {
  let recommender;
  beforeEach(() => {
    recommender = new Recommender([]);
  });
  it("should instantiate the recommender with the baseline weight function", () => {
    assert.property(recommender, "recommender");
  });
  it("should instantiate with an instance of Baseline", () => {
    assert.ok(recommender.recommender instanceof Baseline);
  });
  it("should forward the options to the Baseline weight function", () => {
    const options = {highlightsCoefficients: [1, 2, 3]};
    recommender.updateOptions(options);

    assert.deepEqual(recommender.recommender.options, options);
  });
});
