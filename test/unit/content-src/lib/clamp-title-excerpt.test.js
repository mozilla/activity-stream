import {clampTitleExcerpt} from "content-src/lib/clamp-title-excerpt";
import {GlobalOverrider} from "test/unit/utils";

const HEIGHT = 20;

describe("clampTitleExcerpt", () => {
  let globals;
  let nextNode;
  let nodeHeight;
  let testNode;
  let titleLines;
  let totalLines;

  function test() {
    testNode.setAttribute("data-title-lines", titleLines);
    testNode.setAttribute("data-total-lines", totalLines);
    return clampTitleExcerpt(testNode);
  }

  beforeEach(() => {
    globals = new GlobalOverrider();
    testNode = document.createElement("div");
    nextNode = testNode;
    globals.sandbox.stub(testNode, "nextSibling").get(() => nextNode);
    nodeHeight = HEIGHT;
    globals.sandbox.stub(testNode, "clientHeight").get(() => nodeHeight);
    globals.set("getComputedStyle", () => ({lineHeight: `${HEIGHT}px`}));
    titleLines = 3;
    totalLines = 6;
  });
  afterEach(() => {
    globals.restore();
  });

  it("should do nothing with nothing", () => {
    assert.equal(clampTitleExcerpt(), 0);
  });
  it("should do nothing with no data", () => {
    titleLines = "";

    assert.equal(test(), 0);
  });
  it("should do nothing with no sibling", () => {
    nextNode = null;

    assert.equal(test(), 0);
  });
  it("should clamp 5 for 1-line title of 6", () => {
    assert.equal(test(), 5);
  });
  it("should set excerpt style when clamping", () => {
    test();

    assert.propertyVal(nextNode.style, "webkitLineClamp", "5");
  });
  it("should clamp 4 for 2-line title of 6", () => {
    nodeHeight = 2 * HEIGHT;

    assert.equal(test(), 4);
  });
  it("should do nothing with max/3-line title lines", () => {
    nodeHeight = titleLines * HEIGHT;

    assert.equal(test(), 0);
  });
  it("should clamp 3 for 1-line title of 4", () => {
    totalLines = 4;

    assert.equal(test(), 3);
  });
});
