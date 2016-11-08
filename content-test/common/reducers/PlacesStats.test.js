const PlacesStats = require("common/reducers/PlacesStats");
const {PlacesStatsUpdate} = require("common/action-manager").actions;

describe("PlacesStats reducer", () => {
  it("should have the correct initial state", () => {
    const state = PlacesStats(undefined, {});
    assert.deepEqual(state, {historySize: null, bookmarksSize: null});
  });
  it("should update state when a PlacesStatsUpdate action is fired", () => {
    const state = PlacesStats(undefined, PlacesStatsUpdate(42, 1));
    assert.deepEqual(state, {historySize: 42, bookmarksSize: 1});
  });
  it("should not remove state that already exists", () => {
    const state = PlacesStats({historySize: 1, bookmarksSize: 100}, PlacesStatsUpdate(42));
    assert.deepEqual(state, {historySize: 42, bookmarksSize: 100});
  });
});
