const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;

const TopSites = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  onDelete(url) {
    this.props.dispatch(actions.NotifyHistoryDelete(url));
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
        {sites.map((site) => {
          return (<a key={site.url} className="tile" href={site.url}>
            <div className="inner-border" />
            <SiteIcon className="tile-img-container" site={site} faviconSize={32} showTitle />
            <div className="tile-close-icon" onClick={(ev) => {ev.preventDefault(); this.onDelete(site.url);}}></div>
          </a>);
        })}
        {blankSites}
      </div>
    </section>);
  }
});

TopSites.propTypes = {
  length: React.PropTypes.number,
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
