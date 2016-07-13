const { configure } = require('@kadira/storybook');

require("../data/content/main.css");

function loadStories() {
  require('../content-test/components/Search.story');
  // require as many stories as you need.
}

configure(loadStories, module);
