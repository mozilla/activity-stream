const React = require("react");
const {connect} = require("react-redux");
const {dedupedSites} = require("selectors/selectors");
const TopSites = require("components/TopSites/TopSites");
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const Search = require("components/Search/Search");
const {actions} = require("actions/action-manager");

const NewTabPage = React.createClass({
  // TODO: Replace with real search api via addon
  onSearch(value) {
    this.props.dispatch(actions.NotifyPerformSearch(value));
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
            <Spotlight sites={props.Spotlight.rows} />
          </section>

          <section>
            <GroupedActivityFeed title="Top Activity" sites={props.TopActivity.rows} length={6} />
          </section>
        </div>
      </div>
    </main>);
  }
});

module.exports = connect(dedupedSites)(NewTabPage);
module.exports.NewTabPage = NewTabPage;
