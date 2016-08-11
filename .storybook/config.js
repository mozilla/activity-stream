const {configure} = require("@kadira/storybook");

function loadStories() {
  require("../content-test/components/Spotlight.story");
  require("../content-test/components/ContextMenu.story");
  // require as many stories as you need.
}

configure(loadStories, module);
