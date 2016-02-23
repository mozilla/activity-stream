const React = require("react");
const {connect} = require("react-redux");

const TopSites = require("components/TopSites/TopSites");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const Search = require("components/Search/Search");

const NewTabPage = React.createClass({
  // TODO: Replace with real search api via addon
  onSearch(value) {
    window.location = `https://search.yahoo.com/search?p=${encodeURIComponent(value)}`;
  },
  render() {
    const props = this.props;
    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        <section>
          <Search onSearch={this.onSearch} />
        </section>

        <div className="delayedFadeIn">
          <section>
            <TopSites sites={props.TopSites.rows} />
          </section>

          <section>
            <Spotlight sites={props.History.rows} />
          </section>

          <section>
            <h3 className="section-title">Top Activity</h3>
            <ActivityFeed sites={props.Bookmarks.rows} length={2} />

            <h3 className="section-title">Yesterday</h3>
            <ActivityFeed sites={props.History.rows} length={6} />
          </section>
        </div>
      </div>
    </main>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(NewTabPage);
module.exports.NewTabPage = NewTabPage;
