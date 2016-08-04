const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;

const TopSites = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      activeTile: null
    };
  },
  getDefaultProps() {
    return {
      length: DEFAULT_LENGTH,
      // This is for event reporting
      page: "NEW_TAB"
    };
  },
  onClick(index) {
    this.props.dispatch(actions.NotifyEvent({
      event: "CLICK",
      page: this.props.page,
      source: "TOP_SITES",
      action_position: index
    }));
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    const blankSites = [];
    for (let i = 0; i < (this.props.length - sites.length); i++) {
      blankSites.push(<div className="tile tile-placeholder" key={`blank-${i}`} />);
    }
    return (<section className="top-sites">
      <h3 className="section-title">Top Sites</h3>
      <div className="tiles-wrapper">
        {sites.map((site, i) => {
          const isActive = this.state.showContextMenu && this.state.activeTile === i;
          return (<div className={classNames("tile-outer", {active: isActive})} key={site.guid || site.cache_key || i}>
            <a onClick={() => this.onClick(i)} className="tile" href={site.url}>
              <SiteIcon className="tile-img-container" site={site} faviconSize={32} showTitle={true} />
              <div className="inner-border" />
            </a>
            <LinkMenuButton onClick={ev => {
              ev.preventDefault();
              this.setState({showContextMenu: true, activeTile: i});
            }} />
            <LinkMenu
              visible={isActive}
              onUpdate={val => this.setState({showContextMenu: val})}
              site={site}
              page={this.props.page}
              source="TOP_SITES"
              index={i}
              />
        </div>);
        })}
        {blankSites}
      </div>
    </section>);
  }
});

TopSites.propTypes = {
  length: React.PropTypes.number,
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      title: React.PropTypes.string,
      provider_name: React.PropTypes.string,
      parsedUrl: React.PropTypes.object
    })
  ).isRequired
};

module.exports = connect(justDispatch)(TopSites);
module.exports.TopSites = TopSites;
