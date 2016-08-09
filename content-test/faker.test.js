const {assert} = require("chai");
const {
  createSite,
  createRows,
  randomWeighter,
  createWeightedArray
} = require("test/faker");

describe("createSite", () => {
  it("should create a site", () => {
    assert.isObject(createSite());
  });
  it("should add n images", () => {
    const result = createSite({images: 5});
    assert.isObject(result);
    assert.isArray(result.images);
    assert.lengthOf(result.images, 5);
  });
  it("should override properties", () => {
    const result = createSite({override: {title: null, images: null}});
    assert.isObject(result);
    assert.isNull(result.title);
    assert.isNull(result.images);
  });
  it("should add n favicon_colors", () => {
    const result = createSite({favicon_colors: 5});
    assert.isObject(result);
    assert.isArray(result.favicon_colors);
    assert.lengthOf(result.favicon_colors, 5);
  });
  it("should omit favicon_colors if favicon_url is falsey", () => {
    const result = createSite({favicon_colors: 5, override: {favicon_url: null}});
    assert.isObject(result);
    assert.notProperty(result, "favicon_colors");
  });
});

describe("randomWeighter", () => {
  it("should build the correct array of items based on weight", () => {
    const result = createWeightedArray([
      {weight: 1, value: "yes"},
      {weight: 3, value: "no"}
    ]);
    assert.deepEqual(result, [
      {weight: 1, value: "yes"},
      {weight: 3, value: "no"},
      {weight: 3, value: "no"},
      {weight: 3, value: "no"}]);
  });
  it("should work for options.value", () => {
    const result = randomWeighter([
      {weight: 1, value: 1},
      {weight: 3, value: 2}
    ]);
    assert.include([1, 2], result);
  });
  it("should work for options.values", () => {
    const result = randomWeighter([
      {weight: 1, values: [1, 2, 3]},
      {weight: 3, values: [4, 5, 6]}
    ]);
    assert.include([1, 2, 3, 4, 5, 6], result);
  });
  it("should work for options.range", () => {
    const result = randomWeighter([
      {weight: 1, range: [1, 10]}
    ]);
    assert.include([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], result);
  });
});

describe("createRows", () => {
  it("should create rows of n length", () => {
    assert.lengthOf(createRows({length: 5}), 5);
  });
  it("sites should have times in descending order", () => {
    it("should create rows of n length", () => {
      const rows = createRows();
      rows.forEach((item, i) => {
        if (i === 0) {
          return;
        }
        assert(item.lastVisitDate < rows[i - 1].lastVisitDate);
      });
    });
  });
});
