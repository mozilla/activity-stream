 /* eslint-disable no-console */
const fs = require("fs");
const {mkdir} = require("shelljs");
const path = require("path");

// Note: this file is generated by webpack from system-addon/content-src/activity-stream-prerender.jsx
const prerender = require("./prerender");

const DEFAULT_LOCALE = "en-US";
const DEFAULT_OPTIONS = {
  addonPath: "../system-addon",
  baseUrl: "resource://activity-stream/"
};

// This locales list is to find any similar locales that we can reuse strings
// instead of falling back to the default, e.g., use bn-BD strings for bn-IN.
// https://hg.mozilla.org/mozilla-central/file/tip/browser/locales/l10n.toml
const CENTRAL_LOCALES = [
  "ach",
  "af",
  "an",
  "ar",
  "as",
  "ast",
  "az",
  "be",
  "bg",
  "bn-BD",
  "bn-IN",
  "br",
  "bs",
  "ca",
  "cak",
  "cs",
  "cy",
  "da",
  "de",
  "dsb",
  "el",
  "en-GB",
  "en-ZA",
  "eo",
  "es-AR",
  "es-CL",
  "es-ES",
  "es-MX",
  "et",
  "eu",
  "fa",
  "ff",
  "fi",
  "fr",
  "fy-NL",
  "ga-IE",
  "gd",
  "gl",
  "gn",
  "gu-IN",
  "he",
  "hi-IN",
  "hr",
  "hsb",
  "hu",
  "hy-AM",
  "ia",
  "id",
  "is",
  "it",
  "ja",
  "ja-JP-mac",
  "ka",
  "kab",
  "kk",
  "km",
  "kn",
  "ko",
  "lij",
  "lo",
  "lt",
  "ltg",
  "lv",
  "mai",
  "mk",
  "ml",
  "mr",
  "ms",
  "my",
  "nb-NO",
  "ne-NP",
  "nl",
  "nn-NO",
  "or",
  "pa-IN",
  "pl",
  "pt-BR",
  "pt-PT",
  "rm",
  "ro",
  "ru",
  "si",
  "sk",
  "sl",
  "son",
  "sq",
  "sr",
  "sv-SE",
  "ta",
  "te",
  "th",
  "tl",
  "tr",
  "uk",
  "ur",
  "uz",
  "vi",
  "xh",
  "zh-CN",
  "zh-TW"
];

// Locales that should be displayed RTL
const RTL_LIST = ["ar", "he", "fa", "ur"];

/**
 * Get the language part of the locale.
 */
function getLanguage(locale) {
  return locale.split("-")[0];
}

/**
 * Get the best strings for a single provided locale using similar locales and
 * DEFAULT_LOCALE as fallbacks.
 */
function getStrings(locale, allStrings) {
  const availableLocales = Object.keys(allStrings);

  const language = getLanguage(locale);
  const similarLocales = availableLocales.filter(other =>
    other !== locale && getLanguage(other) === language);

  // Rank locales from least desired to most desired
  const localeFallbacks = [DEFAULT_LOCALE, ...similarLocales, locale];

  // Get strings from each locale replacing with those from more desired ones
  return Object.assign({}, ...localeFallbacks.map(l => allStrings[l]));
}

/**
 * Get the text direction of the locale.
 */
function getTextDirection(locale) {
  return RTL_LIST.indexOf(locale.split("-")[0]) >= 0 ? "rtl" : "ltr";
}

/**
 * templateHTML - Generates HTML for activity stream, given some options and
 * prerendered HTML if necessary.
 *
 * @param  {obj} options
 *         {str} options.locale         The locale to render in lang="" attribute
 *         {str} options.direction      The language direction to render in dir="" attribute
 *         {str} options.baseUrl        The base URL for all local assets
 *         {bool} options.debug         Should we use dev versions of JS libraries?
 * @param  {str} html    The prerendered HTML created with React.renderToString (optional)
 * @return {str}         An HTML document as a string
 */
function templateHTML(options, html) {
  const isPrerendered = !!html;
  const debugString = options.debug ? "-dev" : "";
  const scripts = [
    "chrome://browser/content/contentSearchUI.js",
    `${options.baseUrl}vendor/react${debugString}.js`,
    `${options.baseUrl}vendor/react-dom${debugString}.js`,
    `${options.baseUrl}vendor/react-intl.js`,
    `${options.baseUrl}vendor/redux.js`,
    `${options.baseUrl}vendor/react-redux.js`,
    `${options.baseUrl}prerendered/${options.locale}/activity-stream-strings.js`,
    `${options.baseUrl}data/content/activity-stream.bundle.js`
  ];
  if (isPrerendered) {
    scripts.unshift(`${options.baseUrl}prerendered/static/activity-stream-initial-state.js`);
  }
  return `<!doctype html>
<html lang="${options.locale}" dir="${options.direction}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy-Report-Only" content="script-src 'unsafe-inline'; img-src http: https: data: blob:; style-src 'unsafe-inline'; child-src 'none'; object-src 'none'; report-uri https://tiles.services.mozilla.com/v4/links/activity-stream/csp">
    <link rel="stylesheet" href="chrome://browser/content/contentSearchUI.css" />
    <link rel="stylesheet" href="${options.baseUrl}css/activity-stream.css" />
  </head>
  <body class="activity-stream">
    <div id="root">${isPrerendered ? html : ""}</div>
    <div id="snippets-container">
      <div id="snippets"></div>
    </div>
    <script>
// Don't directly load the following scripts as part of html to let the page
// finish loading to render the content sooner.
for (const src of ${JSON.stringify(scripts, null, 2)}) {
  // These dynamically inserted scripts by default are async, but we need them
  // to load in the desired order (i.e., bundle last).
  const script = document.body.appendChild(document.createElement("script"));
  script.async = false;
  script.src = src;
}
    </script>
  </body>
</html>
`;
}

/**
 * templateJs - Generates a js file that passes the initial state of the prerendered
 * DOM to the React version. This is necessary to ensure the checksum matches when
 * React mounts so that it can attach to the prerendered elements instead of blowing
 * them away.
 *
 * Note that this may no longer be necessary in React 16 and we should review whether
 * it is still necessary.
 *
 * @param  {string} name The name of the global to expose
 * @param  {obj}    data The data to expose as a window global
 * @return {str}         The js file as a string
 */
function templateJs(name, state) {
  return `// Note - this is a generated file.
window.${name} = ${JSON.stringify(state, null, 2)};
`;
}

/**
 * writeFiles - Writes to the desired files the result of a template given
 * various prerendered data and options.
 *
 * @param {string} name          Something to identify in the console
 * @param {string} destPath      Path to write the files to
 * @param {Map}    filesMap      Mapping of a string file name to templater
 * @param {Object} prerenderData Contains the html and state
 * @param {Object} options       Various options for the templater
 */
function writeFiles(name, destPath, filesMap, {html, state}, options) {
  for (const [file, templater] of filesMap) {
    fs.writeFileSync(path.join(destPath, file), templater({html, options, state}));
  }
  console.log("\x1b[32m", `✓ ${name}`, "\x1b[0m");
}

const STATIC_FILES = new Map([
  ["activity-stream-debug.html", ({options}) => templateHTML(options)],
  ["activity-stream-initial-state.js", ({state}) => templateJs("gActivityStreamPrerenderedState", state)],
  ["activity-stream-prerendered-debug.html", ({html, options}) => templateHTML(options, html)]
]);

const LOCALIZED_FILES = new Map([
  ["activity-stream-prerendered.html", ({html, options}) => templateHTML(options, html)],
  ["activity-stream-strings.js", ({options: {strings}}) => templateJs("gActivityStreamStrings", strings)],
  ["activity-stream.html", ({options}) => templateHTML(options)]
]);

/**
 * main - Parses command line arguments, generates html and js with templates,
 *        and writes files to their specified locations.
 */
function main() { // eslint-disable-line max-statements
  // This code parses command line arguments passed to this script.
  // Note: process.argv.slice(2) is necessary because the first two items in
  // process.argv are paths
  const args = require("minimist")(process.argv.slice(2), {
    alias: {
      addonPath: "a",
      baseUrl: "b"
    }
  });

  const baseOptions = Object.assign({debug: false}, DEFAULT_OPTIONS, args || {});
  const addonPath = path.resolve(__dirname, baseOptions.addonPath);
  const allStrings = require(`${baseOptions.addonPath}/data/locales.json`);
  const extraLocales = Object.keys(allStrings).filter(locale =>
    locale !== DEFAULT_LOCALE && !CENTRAL_LOCALES.includes(locale));

  const prerenderedPath = path.join(addonPath, "prerendered");
  console.log(`Writing prerendered files to individual directories under ${prerenderedPath}:`);

  // Save default locale's strings to compare against other locales' strings
  let defaultStrings;
  let langStrings;
  const isSubset = (strings, existing) => existing &&
    Object.keys(strings).every(key => strings[key] === existing[key]);

  // Process the default locale first then all the ones from mozilla-central
  const localizedLocales = [];
  const skippedLocales = [];
  for (const locale of [DEFAULT_LOCALE, ...CENTRAL_LOCALES, ...extraLocales]) {
    // Skip the locale if it would have resulted in duplicate packaged files
    const strings = getStrings(locale, allStrings);
    if (isSubset(strings, defaultStrings) || isSubset(strings, langStrings)) {
      skippedLocales.push(locale);
      continue;
    }

    const prerenderData  = prerender(locale, strings);
    const options = Object.assign({}, baseOptions, {
      direction: getTextDirection(locale),
      locale,
      strings
    });

    // Put locale-specific files in their own directory
    const localePath = path.join(prerenderedPath, "locales", locale);
    mkdir("-p", localePath);
    writeFiles(locale, localePath, LOCALIZED_FILES, prerenderData, options);

    // Only write static files once for the default locale
    if (locale === DEFAULT_LOCALE) {
      const staticPath = path.join(prerenderedPath, "static");
      mkdir("-p", staticPath);
      writeFiles(`${locale} (static)`, staticPath, STATIC_FILES, prerenderData,
        Object.assign({}, options, {debug: true}));

      // Save the default strings to compare against other locales' strings
      defaultStrings = strings;
    }

    // Save the language's strings to maybe reuse for the next similar locales
    if (getLanguage(locale) === locale) {
      langStrings = strings;
    }

    localizedLocales.push(locale);
  }

  if (skippedLocales.length) {
    console.log("\x1b[33m", `Skipped the following locales because they use the same strings as ${DEFAULT_LOCALE} or its language locale: ${skippedLocales.join(", ")}`, "\x1b[0m");
  }
  if (extraLocales.length) {
    console.log("\x1b[31m", `✗ These locales were not in CENTRAL_LOCALES, but probably should be: ${extraLocales.join(", ")}`, "\x1b[0m");
  }

  // Provide some help to copy/paste locales if tests are failing
  console.log(`\nIf aboutNewTabService tests are failing for unexpected locales, make sure its list is updated:\nconst ACTIVITY_STREAM_LOCALES = new Set("${localizedLocales.join(" ")}".split(" "));`);
}

main();
