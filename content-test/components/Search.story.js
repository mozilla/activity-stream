const React = require("react");
const {storiesOf, action} = require("@kadira/storybook");
const { Search } = require("components/Search");
const SearchData = require("lib/fake-data.js")

storiesOf("Search", module)
  .add("first one", () => (
    <Search Search={SearchData.Search} />
    // <button onClick={action("clicked")}>My First Button</button>
  ))
  .add("with no text", () => (
    <button></button>
  ));
