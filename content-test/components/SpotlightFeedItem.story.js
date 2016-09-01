const React = require("react");
const {SpotlightFeedItem} = require("components/Spotlight/SpotlightFeed");
const {storiesOf, action} = require("@kadira/storybook");
const {createMockProvider} = require("../test-utils");
const {createSite} = require("../faker");
const Provider = createMockProvider({dispatch: action("dispatched a redux action")});

// XXX should get rid of container here.  See comment in ContextMenu.story
// for details.
const Container = props => (
  <Provider>
    <div style={{padding: "20px"}} className="grouped-highlight-feed">
      <ul className="activity-feed">
        {props.children}
      </ul>
    </div>
  </Provider>
);

function generateFixture() {
  const site = createSite({images: 1});
  site.bestImage = site.images[0];
  site.source = "Storybook";
  site.page = "Storybook";
  site.index = 0;

  return site;
}

// Note that if a site image is not in the cache, it can take a while
// (eg 10 seconds) to load, because the image load starts very late, for
// unclear reasons.  Presumably something to do with faker, tippy-top-sites,
// lorempixel (used by faker for the images), or Spotlight (aka Highlight)
// itself.
storiesOf("MoreHighlightItem", module)
  .add("All valid properties", () => {
    const site = generateFixture();
    return (<Container><SpotlightFeedItem {...site} /></Container>);
  })
  .add("Is bookmark", () => {
    const site = generateFixture();
    site.bookmarkGuid = "1";
    return (<Container><SpotlightFeedItem {...site} /></Container>);
  })
  .add("Missing an image", () => {
    const site = generateFixture();
    site.bestImage = null;
    site.images = [];
    return (<Container><SpotlightFeedItem {...site} /></Container>);
  })
  .add("Missing a favicon_url", () => {
    const site = generateFixture();
    site.favicon_url = null;
    site.favicon = null;
    site.favicon_color = null;
    site.favicon_colors = null;
    return (<Container><SpotlightFeedItem {...site} /></Container>);
  })
  .add("Missing a description", () => {
    const site = generateFixture();
    site.description = null;
    return (<Container><SpotlightFeedItem {...site} /></Container>);
  });
