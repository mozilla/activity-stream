const React = require("react");
const DEFAULT_LENGTH = 3;
const SpotlightItem = require("components/Spotlight/SpotlightItem");

const Spotlight = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  render() {
    const sites = this.props.sites
      .filter(site => {
        // Don't use sites that don't have an image
        return !!(site.images && site.images[0] && site.images[0].url);
      })
      .slice(0, this.props.length);
    const blankSites = [];
    for (let i = 0; i < (this.props.length - sites.length); i++) {
      blankSites.push(<li className="spotlight-item spotlight-placeholder" key={`blank-${i}`} />);
    }
    return (<section className="spotlight">
      <h3 className="section-title">Spotlight</h3>
      <ul>
        {sites.map((site, i) => <SpotlightItem index={i} key={site.url} {...site} />)}
        {blankSites}
      </ul>
    </section>);
  }
});

Spotlight.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number
};

module.exports = Spotlight;
module.exports.SpotlightItem = SpotlightItem;
