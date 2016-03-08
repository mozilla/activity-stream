const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("actions/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;
const {toRGBString, prettyUrl} = require("lib/utils");

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
          let title;
          let color;
          try {
            title = prettyUrl(site.parsedUrl.hostname);
          } catch (e) {
            //
          }
          if (!title) {
            title = site.provider_name || site.title;
          }
          try {
            color = site.favicon_colors[0].color;
          } catch (e) {
            color = [251, 251, 251];
          }
          const backgroundColor = toRGBString(...color, 0.8);
          return (<a key={site.url} className="tile" href={site.url} style={{backgroundColor}}>
            <div className="inner-border" />
            <div className="tile-img-container">
              <SiteIcon site={site} width={32} height={32} />
            </div>
            <div className="tile-title">{title}</div>
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
      images: React.PropTypes.array,
      icons: React.PropTypes.array,
      url: React.PropTypes.string.isRequired,
      type: React.PropTypes.string,
      description: React.PropTypes.string,
      provider_name: React.PropTypes.string,
      parsedUrl: React.PropTypes.object
    })
  ).isRequired
};

module.exports = connect(justDispatch)(TopSites);
module.exports.TopSites = TopSites;
