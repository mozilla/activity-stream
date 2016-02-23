const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;
const {toRGBString} = require("lib/utils");

const TopSites = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
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
          const color = site.favicon_colors && site.favicon_colors[0] && site.favicon_colors[0].color || [333, 333, 333];
          const backgroundColor = toRGBString(...color, 0.8);
          return (<a key={site.url} className="tile" href={site.url} style={{backgroundColor}}>
            <div className="inner-border" />
            <div className="tile-img-container">
              <SiteIcon site={site} width={32} height={32} />
            </div>
            <div className="tile-title">{site.provider_name}</div>
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
      provider_name: React.PropTypes.string
    })
  ).isRequired
};

module.exports = TopSites;
