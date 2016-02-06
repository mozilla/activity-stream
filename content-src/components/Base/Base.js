const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("actions/action-manager");

const Header = require("components/Header/Header");
const TopSites = require("components/TopSites/TopSites");

// This is a quick placeholder
const Sites = (props) => {
  return (<div className="placeholder-sites">
    <ul>
    {props.sites.map(site => {
      return (<li className="site" key={site.url}>
        <div hidden={!site.image} className="img" style={{backgroundImage: site.image && `url(${site.image.url})`}} />
        <a href={site.url}>{site.title}</a>
        <p hidden={!site.description}>{site.description}</p>
      </li>);
    })}
    </ul>
  </div>);
};

const Main = React.createClass({
  componentDidMount() {
    // This should work!
    this.props.dispatch(actions.RequestTopFrecent());

    // This should fail, since nothing is implemented on the Firefox side
    this.props.dispatch(actions.RequestBookmarks());
  },
  render() {
    const props= this.props;
    return (<div id="base">
      <Header
        userName="Luke Skywalker"
        userImage="https://cdninfinity-a.akamaihd.net/infinitycdn/web/assets/assets/images/icons/og_images/fb/character_luke-skywalker_img1.jpg"
      />
      <main>
        <div className="new-tab-wrapper">
          <div className="new-tab-left">
            <h4>Top Sites</h4>
            <TopSites sites={props.Sites.frecent} />
            <h4>Spotlight</h4>
            <Sites sites={props.Sites.frecent} />
          </div>
          <div className="new-tab-right">
            <h4>Top Activity</h4>
            <Sites sites={props.Bookmarks.rows} />
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
