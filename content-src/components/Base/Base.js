const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("actions/action-manager");

const Header = require("components/Header/Header");
const TopSites = require("components/TopSites/TopSites");

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
        <TopSites sites={props.Sites.frecent} />

      </main>
      <pre>
      {JSON.stringify(props.Sites.frecent, null, 2)}
      {JSON.stringify(props.Sites.changes, null, 2)}
      </pre>
    </div>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(Main);
