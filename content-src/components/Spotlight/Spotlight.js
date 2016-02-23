const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const classNames = require("classnames");
const DEFAULT_LENGTH = 3;
const IMG_HEIGHT = 226;
const IMG_WIDTH =  124;

function getBestImage(images) {
  if (!images || !images.length) {
    return null;
  }
  const filteredImages = images.filter(image => {
    if (!image.url) {
      return false;
    }
    if (!image.width || image.width < IMG_WIDTH) {
      return false;
    }
    if (!image.height || image.height < IMG_HEIGHT) {
      return false;
    }
    return true;
  });

  if (!filteredImages.length) {
    return null;
  }

  return filteredImages.reduce((prev, next) => {
    return next.entropy > prev.entropy ? next : prev;
  }) || null;
}

const SpotlightItem = React.createClass({
  render() {
    const site = this.props;
    const image = getBestImage(site.images);
    const imageUrl = image.url;
    const description = site.description;
    const isPortrait = image.height > image.width;
    return (<li className="spotlight-item">
      <a href={site.url} ref="link">
        <div className={classNames("spotlight-image", {portrait: isPortrait})} style={{backgroundImage: `url(${imageUrl})`}} ref="image">
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
        <div className="inner-border" />
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
        // Don't use sites that don't look good
        return !!(
          getBestImage(site.images) &&
          site.title &&
          site.description &&
          site.title !== site.description
        );
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
module.exports.getBestImage = getBestImage;
module.exports.IMG_HEIGHT = IMG_HEIGHT;
module.exports.IMG_WIDTH =  IMG_WIDTH;
