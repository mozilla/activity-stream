const {configure} = require("@kadira/storybook");

/**
 * Static storybook builds (i.e. those used by storybooks.io) need a slightly
 * different path for their favicons.
 *
 * @type {String}
 */
let staticPrefix = "";

// Note that process.env.STORYBOOK_* variables are injected by storybook
// via webpack.
if (process.env.STORYBOOK_STATIC) {
  staticPrefix = "content/";
}
let stylesheetLink = document.getElementById("main-stylesheet");
stylesheetLink.setAttribute("href", `${staticPrefix}main.css`);

function loadStories() {
  require("../content-test/components/Spotlight-unweighted.story");
  require("../content-test/components/Spotlight.story");
  require("../content-test/components/ContextMenu.story");
  require("../content-test/components/Hint.story");
  // require as many stories as you need.
}

configure(loadStories, module);
