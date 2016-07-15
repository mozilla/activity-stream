const React = require("react");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const {storiesOf, action} = require("@kadira/storybook");
const {createMockProvider} = require("../test-utils");
const {createSite} = require("../faker");
const Provider = createMockProvider({
  dispatch: action("dispatched a redux action")
});

const Container = props => (
  <Provider>
    <div style={{padding: "10px"}}>
      {props.children}
    </div>
  </Provider>
);

storiesOf("Highlight", module)
  .add("All valid properties", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
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
    site.favicon = null;
    site.favicon_color = null;
    site.favicon_colors = null;
    return (<Container><SpotlightItem {...site} /></Container>);
  })
  .add("Missing a description", () => {
    const site = createSite({images: 1});
    site.bestImage = site.images[0];
    site.description = null;
    return (<Container><SpotlightItem {...site} /></Container>);
  });
