const React = require("react");
const {Bookmarks} = require("components/Bookmarks/Bookmarks");
const {storiesOf, action} = require("@kadira/storybook");
const {selectNewTabSites} = require("common/selectors/selectors");
const {createMockProvider, rawMockData, faker} = require("test/test-utils");
const {BOOKMARKS_LENGTH} = require("common/constants");
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
let fakeBookmarksItems = mockData.Bookmarks.rows;

storiesOf("Highlight List", module)
  .add("All valid properties", () =>
    <Container>
      <Bookmarks length={BOOKMARKS_LENGTH} page="BOOKMARKS_STORYBOOK" sites={fakeBookmarksItems} />
    </Container>
  )
  .add("Missing a row (eg because user has insufficient history)", () =>
    <Container>
      <Bookmarks length={BOOKMARKS_LENGTH} page="BOOKMARKS_STORYBOOK" sites={fakeBookmarksItems.slice(2)} />
    </Container>
  )
  .add("Missing an item (eg because user has insufficient history)", () =>
    <Container>
      <Bookmarks length={BOOKMARKS_LENGTH} page="BOOKMARKS_STORYBOOK" sites={fakeBookmarksItems.slice(1)} />
    </Container>
  )
  .add("Placeholder view (data still loading)", () =>
    <Container>
      <Bookmarks placeholder={true} length={BOOKMARKS_LENGTH} page="BOOKMARKS_STORYBOOK" sites={fakeBookmarksItems} />
    </Container>
  );
