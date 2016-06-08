#! /usr/bin/env node
"use strict";
const defaults = {
  baseUrl: "",
  title: "Loading...",
  csp: "on"
};

function template(rawOptions) {
  const options = Object.assign({}, defaults, rawOptions || {});
  const csp = options.csp === "on" ?
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'self'; img-src http: https: data:; style-src 'self' 'unsafe-inline'; child-src 'self' https://*.youtube.com https://*.vimeo.com; frame-src 'self' https://*.youtube.com https://*.vimeo.com\">" :
    "";
  return `<!doctype html>
<html lang="en-us">
  <head>
    <meta charset="utf-8">
    ${csp}
    <title>${options.title}</title>
    <link rel="stylesheet" href="${options.baseUrl}main.css" />
    <link rel="icon" type="image/svg+xml" href="${options.baseUrl}img/newtab-icon.svg">
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
