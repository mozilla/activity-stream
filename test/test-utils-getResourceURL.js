"use strict";

const {baseURI, getResourceURL} = require("addon/task-queue/utils");

exports["test resource paths"] = function(assert) {
  assert.equal(getResourceURL("some/path.file"), `${baseURI}some/path.file`, "relative paths work");
  assert.equal(getResourceURL("/some/path.file"), `${baseURI}some/path.file`, "extra slashes are handled");
};

require("sdk/test").run(exports);
