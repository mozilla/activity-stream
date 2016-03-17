#! /usr/bin/env node
"use strict";
const defaults = {
  baseUrl: "",
  title: "Loading..."
};

function template(rawOptions) {
  const options = Object.assign({}, defaults, rawOptions || {});
  return `
<!doctype html>
<html lang=en-us>
  <head>
    <meta charset="utf-8">
    <title>${options.title}</title>
    <link rel="stylesheet" href="${options.baseUrl}main.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="${options.baseUrl}vendor.bundle.js"></script>
    <script src="${options.baseUrl}bundle.js"></script>
  </body>
</html>
`;
}

module.exports = template;

if (require.main === module)  {
  // called from command line
  const args = require("minimist")(process.argv.slice(2), {
    alias: {baseUrl: "b", title: "t"}
  });
  process.stdout.write(template(args));
}
