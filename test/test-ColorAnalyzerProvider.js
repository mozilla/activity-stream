const test = require("sdk/test");
const {getColor} = require("addon/ColorAnalyzerProvider");
const {colors, fails} = require("./resources/colors");

exports["test getColor"] = function*(assert) {
  for (let color of colors) {
    const result = yield getColor(color.uri);
    assert.deepEqual(result, color.rgb, `color should be ${color.rgb.join(", ")}`);
  }
};

exports["test getColor errors"] = function*(assert) {
  for (let i = 0; i < fails.length; i++) {
    try {
      yield getColor(fails[i]);
    } catch (e) {
      assert.ok(e, `image ${i} should throw the right error`);
    }
  }
};

test.run(exports);
