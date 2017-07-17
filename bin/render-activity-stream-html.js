const fs = require("fs");
const path = require("path");
const prerender = require("./prerender");

const HTML_FILE_PATH = path.resolve(__dirname, "../system-addon/data/content/activity-stream.html");

const DEFAULT_OPTIONS = {
  baseUrl: "resource://activity-stream/",
  locale: "en-US",
  title: "New Tab"
};

function template(rawOptions) {
  const options = Object.assign({}, DEFAULT_OPTIONS, rawOptions || {});
  const {html, state} = prerender(options.locale);

  return `<!doctype html>
<html lang="${options.locale}" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>${options.title}</title>
    <link rel="stylesheet" href="chrome://browser/content/contentSearchUI.css" />
    <link rel="stylesheet" href="${options.baseUrl}data/content/activity-stream.css" />
    <link rel="icon" type="image/svg+xml" href="${options.baseUrl}img/newtab-icon.svg">
  </head>
  <body>
    ${html}
    <script>
      window._INITIAL_STATE = ${JSON.stringify(state)};
    </script>
    <script src="chrome://browser/content/contentSearchUI.js"></script>
    <script src="${options.baseUrl}vendor/react.js"></script>
    <script src="${options.baseUrl}vendor/react-dom.js"></script>
    <script src="${options.baseUrl}vendor/react-intl.js"></script>
    <script src="${options.baseUrl}vendor/redux.js"></script>
    <script src="${options.baseUrl}vendor/react-redux.js"></script>
    <script src="${options.baseUrl}data/content/activity-stream.bundle.js"></script>
  </body>
</html>
`;
}

const args = require("minimist")(process.argv.slice(2), {alias: {baseUrl: "b", title: "t", locale: "l"}});

const text = template(args);

fs.writeFileSync(HTML_FILE_PATH, text); // eslint-disable-line no-sync

console.log(`Done writing html to: ${HTML_FILE_PATH}`); // eslint-disable-line no-console
