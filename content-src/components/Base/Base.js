const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("actions/action-manager");

const Header = require("components/Header/Header");
const TopSites = require("components/TopSites/TopSites");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");

const Main = React.createClass({
  componentDidMount() {
    // This should work!
    this.props.dispatch(actions.RequestTopFrecent());

    // This should fail, since nothing is implemented on the Firefox side
    this.props.dispatch(actions.RequestBookmarks());
  },
  render() {
    const props = this.props;
    return (<div id="base">
      <Header
        userName="Luke Skywalker"
        userImage="https://cdninfinity-a.akamaihd.net/infinitycdn/web/assets/assets/images/icons/og_images/fb/character_luke-skywalker_img1.jpg"
      />
      <main>
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
      </main>
    </div>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(Main);
