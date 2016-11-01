const {configure} = require("@kadira/storybook");

// XXX do we need to actually depend on the main scss files, or should we
// just ensure that "npm run start" is going simultaneously?
require("../data/content/main.css");

function loadStories() {
  require("../content-test/components/Spotlight.story");
  require("../content-test/components/ContextMenu.story");
  require("../content-test/components/Hint.story");
  // require as many stories as you need.
}

configure(loadStories, module);
