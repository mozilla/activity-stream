const React = require("react");
const {Link} = require("react-router");
const classNames = require("classnames");
const Header = require("components/Header/Header");
const {l10n} = require("lib/utils");

const TimelinePage = React.createClass({
  componentDidMount() {
    document.l10n.setAttributes(
      document.head.querySelector("title"),
      "timeline-page-title"
    );
  },
  render() {
    const props = this.props;
    const pathname = props.location && props.location.pathname;
    const navItems = [
      {title: "All", "data-l10n-id": "timeline-page-all", to: "/timeline", active: true, icon: "fa-firefox"},
      {title: "Bookmarks", "data-l10n-id": "timeline-page-bookmarks", to: "/timeline/bookmarks", icon: "fa-star"}
    ];
    return (<div className="outer-wrapper">
      <Header
        title="Activity Stream"
        data-l10n-id="timeline-page-header"
        icon="fa-timeline"
        pathname={pathname}
        links={[{title: "Home", "data-l10n-id": "timeline-page-home", to: "/"}]} />
      <main className="timeline">
        <nav className="sidebar" onScroll={this.onScroll}>
          <ul>
            {navItems.map(item => {
              return (<li key={item.to}>
                <Link to={item.to} className={classNames({active: item.to === pathname})}>
                  <span className={`fa ${item.icon}`} />
                  <span {...l10n(item)} className="link-title">{item.title}</span>
                </Link>
              </li>);
            })}
          </ul>
        </nav>
        <section className="content">
          {this.props.children}
        </section>
      </main>
    </div>);
  }
});

module.exports = TimelinePage;
