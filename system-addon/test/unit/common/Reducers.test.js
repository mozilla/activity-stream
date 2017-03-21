const {reducers, INITIAL_STATE} = require("common/Reducers.jsm");
const {TopSites} = reducers;

describe("Reducers", () => {
  describe("TopSites", () => {
    it("should return the initial state", () => {
      const nextState = TopSites(undefined, {type: "FOO"});
      assert.equal(nextState, INITIAL_STATE.TopSites);
    });
  });
});
