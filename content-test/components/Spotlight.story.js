const React = require("react");
const {Spotlight, SpotlightItem} = require("components/Spotlight/Spotlight");
const {storiesOf, action} = require("@kadira/storybook");
const {selectNewTabSites} = require("common/selectors/selectors");
const {createMockProvider, rawMockData, faker} = require("test/test-utils");
const {HIGHLIGHTS_LENGTH} = require("common/constants");
const createSite = faker.createSite;
const Provider = createMockProvider({dispatch: action("dispatched a redux action")});

// We have to set up both faker slightly differently if we're building
// statically (eg for storybooks.io).  In theory, we should need to run
// the faker thing from any story file that uses faker, but for whatever
// reason, that doesn't seem to actually be true.  I'd guess that webpack
// somehow optimizes things so that there's only a single copy of faker
// in memory at once.  Interestingly, putting this code in config.js doesn't
// work at all.

// Note that process.env.STORYBOOK_* variables are injected by storybook
// via webpack.
if (process.env.STORYBOOK_STATIC) {
  faker.base_tip_top_favicon_prefix = "content/";
}

// XXX should get rid of container here.  See comment in ContextMenu.story
// for details.

// 698px = $wrapper-max-width + 2 (presumably for the border)
const style = {width: "698px"};
const Container = props => (
  <Provider>
    <div style={style}>
      {props.children}
    </div>
  </Provider>
);

// Note that if a site image is not in the cache, it can take a while
// (eg 10 seconds) to load, because the image load starts very late, for
// unclear reasons.  Presumably something to do with faker, tippy-top-sites,
// lorempixel (used by faker for the images), or Spotlight (aka Highlight)
// itself.
let mockData = Object.assign({}, rawMockData, selectNewTabSites(rawMockData));
let fakeSpotlightItems = mockData.Highlights.rows;

storiesOf("Highlight List", module)
  .add("All valid properties", () =>
    <Container>
      <Spotlight length={HIGHLIGHTS_LENGTH} page="SPOTLIGHT_STORYBOOK" sites={fakeSpotlightItems} />
    </Container>
  )
  .add("Missing a row (eg because user has insufficient history)", () =>
    <Container>
      <Spotlight length={HIGHLIGHTS_LENGTH} page="SPOTLIGHT_STORYBOOK" sites={fakeSpotlightItems.slice(3)} />
    </Container>
  )
  .add("Missing an item (eg because user has insufficient history)", () =>
    <Container>
      <Spotlight length={HIGHLIGHTS_LENGTH} page="SPOTLIGHT_STORYBOOK" sites={fakeSpotlightItems.slice(1)} />
    </Container>
  )
  .add("Placeholder view (data still loading)", () =>
    <Container>
      <Spotlight placeholder={true} length={HIGHLIGHTS_LENGTH} page="SPOTLIGHT_STORYBOOK" sites={fakeSpotlightItems} />
    </Container>
  );

storiesOf("Highlight Item", module)
  .add("All valid properties", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Title overflows text area", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    site.title = "The Most Awesome Aggregator Site You're Ever Going To See On The Entire English-Speaking Part World Wide Web";
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Title + desc overflows text area", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    site.title = "The Most Awesome Aggregator Site You're Ever Going To See";
    site.description = "The quick brown fox jumps over the laziest dog";
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Missing provider_name metadata", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    delete site.provider_name;
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Missing an image", () => {
    const site = createSite({images: 0});
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Missing a favicon_url", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    site.favicon_url = null;
    site.background_color = null;
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Missing a description", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    site.description = null;
    return (<Container><SpotlightItem {...site} /></Container>);
  });
