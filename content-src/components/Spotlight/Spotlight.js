const React = require("react");
const DEFAULT_LENGTH = 3;
const SiteIcon = require("components/SiteIcon/SiteIcon");

const SpotlightItem = React.createClass({
  render() {
    const site = this.props;
    const imageUrl = site.images[0].url;
    const description = site.description;
    return (<li className="spotlight-item">
      <a href={site.url} ref="link">
        <div className="spotlight-image" style={{backgroundImage: `url(${imageUrl})`}} ref="image">
          <SiteIcon className="spotlight-icon" site={site} ref="icon" height={32} width={32} />
        </div>
        <div className="spotlight-details">
          <div className="spotlight-info">
            <h4 ref="title" className="spotlight-title">
              {site.title}
            </h4>
            <p className="spotlight-description" ref="description">{description}</p>
            <div className="spotlight-type">Last opened on iPhone</div>
          </div>
        </div>
      </a>
    </li>);
  }
});

SpotlightItem.propTypes = {
  url: React.PropTypes.string.isRequired,
  images: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      url: React.PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  favicon_url: React.PropTypes.string,
  icons: React.PropTypes.array,
  title: React.PropTypes.string,
  description: React.PropTypes.string
};

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
        {sites.map(site => <SpotlightItem key={site.url} {...site} />)}
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
