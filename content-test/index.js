const req = require.context(".", true, /\.test.js$/);
const files = req.keys();
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

files.forEach(file => req(file));

// require("test/components/NewTabPage.test.js");
