 /* eslint-disable no-console */
const fs = require("fs");
const {mkdir} = require("shelljs");
const path = require("path");

const {CENTRAL_LOCALES, DEFAULT_LOCALE} = require("./locales");

// Note: DEFAULT_OPTIONS.baseUrl should match BASE_URL in aboutNewTabService.js
//       in mozilla-central.
const DEFAULT_OPTIONS = {
  addonPath: "..",
  baseUrl: "resource://activity-stream/",
};

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
  const desired = Object.assign({}, ...localeFallbacks.map(l => allStrings[l]));

  // Only include strings that are currently used (defined by default locale)
  return Object.assign({}, ...Object.keys(allStrings[DEFAULT_LOCALE]).map(
    key => ({[key]: desired[key]})));
}

/**
 * Get the text direction of the locale.
 */
function getTextDirection(locale) {
  return RTL_LIST.includes(locale.split("-")[0]) ? "rtl" : "ltr";
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
 *         {bool} options.noscripts     Should we include scripts in the prerendered files?
 * @return {str}         An HTML document as a string
 */
function templateHTML(options) {
  const debugString = options.debug ? "-dev" : "";
  const scripts = [
    "chrome://browser/content/contentSearchUI.js",
    "chrome://browser/content/contentTheme.js",
    `${options.baseUrl}vendor/react${debugString}.js`,
    `${options.baseUrl}vendor/react-dom${debugString}.js`,
    `${options.baseUrl}vendor/prop-types.js`,
    `${options.baseUrl}vendor/redux.js`,
    `${options.baseUrl}vendor/react-redux.js`,
    `${options.baseUrl}prerendered/${options.locale}/activity-stream-strings.js`,
    `${options.baseUrl}data/content/activity-stream.bundle.js`,
  ];

  // Add spacing and script tags
  const scriptRender = `\n${scripts.map(script => `    <script src="${script}"></script>`).join("\n")}`;

  return `<!doctype html>
<html lang="${options.locale}" dir="${options.direction}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; object-src 'none'; script-src resource: chrome:; connect-src https:; img-src https: data: blob:; style-src 'unsafe-inline';">
    <title data-l10n-id="newtab-page-title"></title>
    <link rel="icon" type="image/png" href="chrome://branding/content/icon32.png"/>
    <link rel="localization" href="browser/branding/brandings.ftl" />
    <link rel="localization" href="browser/newtab/newtab.ftl" />
    <link rel="stylesheet" href="chrome://browser/content/contentSearchUI.css" />
    <link rel="stylesheet" href="${options.baseUrl}css/activity-stream.css" />
  </head>
  <body class="activity-stream">
    <div id="header-asrouter-container" role="presentation"></div>
    <div id="root"></div>
    <div id="footer-asrouter-container" role="presentation"></div>${options.noscripts ? "" : scriptRender}
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
 * @param  {string} desc Extra description to include in a js comment
 * @param  {obj}   state The data to expose as a window global
 * @return {str}         The js file as a string
 */
function templateJs(name, desc, state) {
  return `// Note - this is a generated ${desc} file.
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
 * @param {Object} options       Various options for the templater
 */
function writeFiles(name, destPath, filesMap, options) {
  for (const [file, templater] of filesMap) {
    fs.writeFileSync(path.join(destPath, file), templater({options}));
  }
  console.log("\x1b[32m", `✓ ${name}`, "\x1b[0m");
}

const STATIC_FILES = new Map([
  ["activity-stream-debug.html", ({options}) => templateHTML(options)],
]);

const LOCALIZED_FILES = new Map([
  ["activity-stream-strings.js", ({options: {locale, strings}}) => templateJs("gActivityStreamStrings", locale, strings)],
  ["activity-stream.html", ({options}) => templateHTML(options)],
  ["activity-stream-noscripts.html", ({options}) => templateHTML(Object.assign({}, options, {noscripts: true}))],
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
      baseUrl: "b",
    },
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
  for (const locale of [DEFAULT_LOCALE, ...CENTRAL_LOCALES]) {
    // Skip the locale if it would have resulted in duplicate packaged files
    const strings = getStrings(locale, allStrings);
    if (isSubset(strings, defaultStrings) || isSubset(strings, langStrings)) {
      skippedLocales.push(locale);
      continue;
    }

    const options = Object.assign({}, baseOptions, {
      direction: getTextDirection(locale),
      locale,
      strings,
    });

    // Put locale-specific files in their own directory
    const localePath = path.join(prerenderedPath, "locales", locale);
    mkdir("-p", localePath);
    writeFiles(locale, localePath, LOCALIZED_FILES, options);

    // Only write static files once for the default locale
    if (locale === DEFAULT_LOCALE) {
      const staticPath = path.join(prerenderedPath, "static");
      mkdir("-p", staticPath);
      writeFiles(`${locale} (static)`, staticPath, STATIC_FILES,
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
    console.log("\x1b[33m", `Skipped the following locales because they are not in CENTRAL_LOCALES: ${extraLocales.join(", ")}`, "\x1b[0m");
  }

  // Convert ja-JP-mac lang tag to ja-JP-macos bcp47 to work around bug 1478930
  const bcp47String = localizedLocales.join(" ").replace(/(ja-JP-mac)/, "$1os");

  // Provide some help to copy/paste locales if tests are failing
  console.log(`\nIf aboutNewTabService tests are failing for unexpected locales, make sure its list is updated:\nconst ACTIVITY_STREAM_BCP47 = "${bcp47String}".split(" ");`);
}

main();
