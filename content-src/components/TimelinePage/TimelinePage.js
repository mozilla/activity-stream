const React = require("react");
const {Link} = require("react-router");
const classNames = require("classnames");
const Header = require("components/Header/Header");
const setFavicon = require("lib/set-favicon");

const TimelinePage = React.createClass({
  componentDidMount() {
    document.title = "Activity Stream";
    setFavicon("glyph-activityStream-16.svg");
  },
  render() {
    const props = this.props;
    const pathname = props.location && props.location.pathname;
    const navItems = [
      {title: "All", to: "/timeline", active: true, icon: "firefox-white"},
      {title: "Bookmarks", to: "/timeline/bookmarks", icon: "bookmark-white"}
    ];
    return (<div className="outer-wrapper">
      <Header
        disabled={true}
        title="Activity Stream"
        icon="timeline"
        pathname={pathname}
        links={[{title: "Home", to: "/"}]} />
      <main className="timeline">
        <nav className="sidebar" onScroll={this.onScroll}>
          <ul>
            {navItems.map(item =>
              (<li key={item.to}>
                <Link to={item.to} className={classNames({active: item.to === pathname})}>
                  <span className={`icon icon-${item.icon}`} />
                  <span className="link-title">{item.title}</span>
                </Link>
              </li>)
            )}
          </ul>
        </nav>
        {this.props.children}
      </main>
    </div>);
  }
});

module.exports = TimelinePage;
