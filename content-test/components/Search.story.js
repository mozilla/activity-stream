const React = require("react");
const {storiesOf, action} = require("@kadira/storybook");
const {Search} = require("components/Search/Search");
const SearchData = require("lib/fake-data.js").Search;

storiesOf("Search", module)
  .add("first one", () => (
    <Search {...SearchData} dispatch={() => {}}/>
  ))
  .add("with no text", () => (
    <button></button>
  ));
