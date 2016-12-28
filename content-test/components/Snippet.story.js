const React = require("react");
const {storiesOf} = require("@kadira/storybook");
const Snippet = require("components/Snippet/Snippet");

const sampleProps = {
  visible: true,
  title: "Snippet Headline",
  image: "https://support.cdn.mozilla.net/static/sumo/img/firefox-512.png?v=1",
  description: "Your snippet text goes here and should not be any longer than a Tweet, (140 characters). <a href='#'>Links should look like this.</a>",
  setVisibility: () => {}
};

storiesOf("Snippet", module)
  .add("Basic example", () => <Snippet {...sampleProps} />)
  .add("No title", () => <Snippet {...sampleProps} title={null} />)
  .add("No image", () => <Snippet {...sampleProps} image={null} />);
