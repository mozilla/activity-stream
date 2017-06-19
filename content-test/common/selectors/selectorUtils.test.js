const {areSelectorsReady} = require("common/selectors/selectorUtils.js");

describe("selectorUtils", () => {
  describe("areSelectorsReady", () => {
    it("should return true if state.{TopSites,Experiments}.init are all true", () => {
      const fakeStoreState = {
        TopSites: {init: true},
        Experiments: {init: true}
      };

      assert.isTrue(areSelectorsReady(fakeStoreState));
    });
    it("should return true if state.TopSites.init is false", () => {
      const fakeStoreState = {
        TopSites: {init: false},
        Experiments: {init: true}
      };

      assert.isFalse(areSelectorsReady(fakeStoreState));
    });
    it("should return true if state.Experiments.init is false", () => {
      const fakeStoreState = {
        TopSites: {init: true},
        Experiments: {init: false}
      };

      assert.isFalse(areSelectorsReady(fakeStoreState));
    });
  });
});
