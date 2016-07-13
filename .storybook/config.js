const { configure } = require('@kadira/storybook');

function loadStories() {
  require('../content-test/components/Search.story');
  // require as many stories as you need.
}

configure(loadStories, module);
