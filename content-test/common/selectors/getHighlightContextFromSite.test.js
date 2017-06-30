const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");

describe("getHighlightContextFromSite", () => {
  it("should set type:history for history items", () => {
    assert.deepEqual(
      getHighlightContextFromSite({type: "history", lastVisitDate: 123}),
      {type: "history", date: 123}
    );
  });
  it("should set type:bookmark for items that have a bookmark", () => {
    assert.deepEqual(
      getHighlightContextFromSite({type: "history", lastVisitDate: 111, bookmarkDateCreated: 123, bookmarkLastModified: 123}),
      {type: "bookmark", date: 123}
    );
  });
  it("should set type:synced for items that have .syncedFrom", () => {
    assert.deepEqual(
      getHighlightContextFromSite({type: "history", lastVisitDate: 111, syncedFrom: "my iphone"}),
      {type: "synced", date: 111, label: "Synced from my iphone"}
    );
  });
  it("should set type:open for items that have .isOpen", () => {
    assert.deepEqual(
      getHighlightContextFromSite({type: "open", lastVisitDate: 111, isOpen: true}),
      {type: "open", date: 111}
    );
  });
  it("should set a label if .context_message is set", () => {
    assert.equal(getHighlightContextFromSite({context_message: "Foo bar"}).label, "Foo bar");
  });
});
