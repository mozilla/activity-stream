const React = require("react");
const {connect} = require("react-redux");
const shortURL = require("content-src/lib/short-url");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");

class TopSite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showContextMenu: false, activeTile: null};
  }
  toggleContextMenu(event, index) {
    this.setState({showContextMenu: true, activeTile: index});
  }
  render() {
    const {link, index} = this.props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeTile === index;
    const title = shortURL(link);
    const screenshotClassName = `screenshot${link.screenshot ? " active" : ""}`;
    const topSiteOuterClassName = `top-site-outer${isContextMenuOpen ? " active" : ""}`;
    const style = {backgroundImage: (link.screenshot ? `url(${link.screenshot})` : "none")};
    return (<li className={topSiteOuterClassName} key={link.url}>
        <a href={link.url}>
          <div className="tile" aria-hidden={true}>
              <span className="letter-fallback">{title[0]}</span>
              <div className={screenshotClassName} style={style} />
          </div>
          <div className="title">{title}</div>
        </a>
        <button className="context-menu-button"
          onClick={e => {
            e.preventDefault();
            this.toggleContextMenu(e, index);
          }}>
          <span className="sr-only">{`Open context menu for ${title}`}</span>
        </button>
        <LinkMenu
          visible={isContextMenuOpen}
          onUpdate={val => this.setState({showContextMenu: val})}
          site={link}
          index={index} />
    </li>);
  }
}

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map((link, index) => <TopSite key={link.url} link={link} index={index} />)}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
module.exports._unconnected = TopSites;
module.exports.TopSite = TopSite;
