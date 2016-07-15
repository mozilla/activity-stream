const {configure} = require('@kadira/storybook');

require("../data/content/main.css");

function loadStories() {
  require('../content-test/components/Provider.story');
  require('../content-test/components/Spotlight.story');
  require('../content-test/components/ContextMenu.story');
  require('../content-test/components/Search.story');
  // require as many stories as you need.
}

configure(loadStories, module);
