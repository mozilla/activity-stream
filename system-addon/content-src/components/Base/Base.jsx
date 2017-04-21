const React = require("react");
const TopSites = require("content-src/components/TopSites/TopSites");
const Search = require("content-src/components/Search/Search");

const Base = () => (<div className="outer-wrapper"><main>
  <Search />
  <TopSites />
</main></div>);

module.exports = Base;
