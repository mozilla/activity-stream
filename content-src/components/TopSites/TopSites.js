const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const DeleteMenu = require("components/DeleteMenu/DeleteMenu");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

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
          return (<div className="tile-outer" key={site.cacheKey || i}>
            <a onClick={() => this.onClick(i)} className={classNames("tile", {active: isActive})} href={site.url}>
              <SiteIcon className="tile-img-container" site={site} faviconSize={32} showTitle />
              <div hidden={site.type === FIRST_RUN_TYPE} className="tile-close-icon" onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.setState({showContextMenu: true, activeTile: i});
              }}></div>
              <div className="inner-border" />
            </a>
            <DeleteMenu
              visible={isActive}
              onUpdate={val => this.setState({showContextMenu: val})}
              url={site.url}
              page={this.props.page}
              index={i}
              source="TOP_SITES"
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
