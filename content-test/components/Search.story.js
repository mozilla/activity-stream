const React = require("react");
const {storiesOf} = require("@kadira/storybook");
const {Search} = require("../../content-src/components/Search/Search");
const SearchData = require("lib/fake-data.js").Search;

storiesOf("Search", module)
  .add("search box", () => (
    <Search {...SearchData} dispatch={() => {}}/>
  ));
