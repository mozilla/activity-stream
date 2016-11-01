const React = require("react");
const {NewTabPage} = require("components/NewTabPage/NewTabPage");
const {storiesOf, action} = require("@kadira/storybook");
const {createMockProvider, mockData, faker} = require("test/test-utils");
const dispatch = action("dispatched a redux action");
const Provider = createMockProvider({dispatch});

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

const Container = props => (
  <Provider>
    <div>
      {props.children}
    </div>
  </Provider>
);

// Note that if a site image is not in the cache, it can take a while
// (eg 10 seconds) to load, because the image load starts very late, for
// unclear reasons.  Presumably something to do with faker, tippy-top-sites,
// lorempixel (used by faker for the images), or Spotlight (aka Highlight)
// itself.

storiesOf("NewTabPage", module)
  .add("Be on the lookout popup", () =>
    <Container>
      <NewTabPage {...mockData} page="SPOTLIGHT_STORYBOOK" dispatch={dispatch} />,
    </Container>
  );
