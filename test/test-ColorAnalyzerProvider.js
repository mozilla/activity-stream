const test = require("sdk/test");
const {getColor} = require("lib/ColorAnalyzerProvider");
const {colors} = require("./resources/colors");

exports["test getColor"] = function*(assert) {
  for (let i in colors) {
    const color = colors[i];
    const result = yield getColor(color.uri);
    assert.deepEqual(result, color.rgb, `color should be ${color.rgb.join(", ")}`);
  }
};

exports["test getColor errors"] = function*(assert) {
  try {
    yield getColor("badURIhahaha");
  } catch (e) {
    assert.equal(e.message, "There was an error processing this image", "should throw the right error");
  }
};

test.run(exports);
