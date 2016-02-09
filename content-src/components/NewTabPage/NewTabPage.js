const React = require("react");
const {connect} = require("react-redux");

const TopSites = require("components/TopSites/TopSites");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");

const NewTabPage = React.createClass({
  render() {
    const props = this.props;
    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        <div className="left">
          <TopSites sites={props.Sites.frecent} />
        </div>
        <div className="right">
          <h3 className="section-title">Top Activity</h3>
          <ActivityFeed sites={props.Bookmarks.rows} />

          <h3 className="section-title">Yesterday</h3>
          <ActivityFeed sites={props.Bookmarks.rows} />
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
