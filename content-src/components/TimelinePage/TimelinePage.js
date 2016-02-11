const React = require("react");
const {connect} = require("react-redux");

const ActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");

// TODO: replace this with the appropriate actions/reducers/shim.
const fakeSpotlightItems = require("lib/shim").data.fakeSpotlightItems;

const TimelinePage = React.createClass({
  render() {
    const props = this.props;
    const navItems = [
      {title: "All", active: true, icon: "fa-firefox"},
      {title: "Bookmarks", icon: "fa-star"}
    ];
    return (<main className="timeline">
      <nav className="sidebar">
        <ul>
          {navItems.map((item, idx) => {
            return (<li key={idx}>
              <a className={item.active ? "active" : ""}>
                <span className={`fa ${item.icon}`} /> {item.title}
              </a>
            </li>);
          })}
        </ul>
      </nav>
      <section className="content">
        <div className="wrapper">
          <Spotlight sites={fakeSpotlightItems} />
          <h3 className="section-title">Just now</h3>
          <ActivityFeed sites={props.Bookmarks.rows} />
        </div>
      </section>
    </main>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(TimelinePage);
module.exports.TimelinePage = TimelinePage;
