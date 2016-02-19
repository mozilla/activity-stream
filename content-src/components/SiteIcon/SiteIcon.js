const React = require("react");
const classNames = require("classnames");
const utils = require("lib/utils");

const DEFAULT_FALLBACK_BG_COLOR = [200, 200, 200];
const MIN_RESOLUTION = 2;
const FAVICON_SIZE = 16;

function getSiteImage(site, width) {
  const {favicon_url, icons} = site;
  if (icons && icons.length) {
    return icons[0].url;
  } else if (favicon_url && width / FAVICON_SIZE <= MIN_RESOLUTION) {
    return favicon_url;
  } else {
    return null;
  }
}

const SiteIconImage = React.createClass({
  render() {
    // TODO: Do something more sophisticated than choose the first icon in the array
    return (<div className="site-icon-image" ref="image"
      style={{backgroundImage: `url(${getSiteImage(this.props, this.props.width)})`}}>
    </div>);
  }
});

SiteIconImage.propTypes = {
  icons: React.PropTypes.arrayOf(React.PropTypes.shape({
    url: React.PropTypes.string.isRequired
  })),
  favicon_url: React.PropTypes.string,
  width: React.PropTypes.number
};

function getFallbackColors(favicon_colors) {
  let backgroundColor = DEFAULT_FALLBACK_BG_COLOR;

  if (favicon_colors && favicon_colors[0]) {
    backgroundColor = favicon_colors[0].color;
  }

  return {
    backgroundColor: utils.toRGBString(backgroundColor),
    color: utils.getBlackOrWhite(...backgroundColor)
  };
}

const SiteIconFallback = React.createClass({
  render() {
    const {favicon_colors, title, provider_name, provider_display} = this.props;
    const letter = (provider_name || provider_display || title || "")[0];
    const style = getFallbackColors(favicon_colors);
    return (<div className="site-icon-fallback" ref="fallback"
      style={style}>
      {letter}
    </div>);
  }
});

SiteIconFallback.propTypes = {
  favicon_colors: React.PropTypes.arrayOf(React.PropTypes.shape({
    color: React.PropTypes.arrayOf(React.PropTypes.number)
  })),
  provider_name: React.PropTypes.string,
  provider_display: React.PropTypes.string,
  title: React.PropTypes.string
};

const SiteIcon = React.createClass({
  getDefaultProps() {
    return {
      site: {},
      height: 100,
      width: 100
    };
  },
  render() {
    const {site, width, height} = this.props;
    const Icon = getSiteImage(site, width) ? SiteIconImage : SiteIconFallback;

    const fontSize = Math.max(height * 0.33, 16);
    const fontWeight = fontSize > 24 ? 200 : 400;

    return (<div className={classNames("site-icon", this.props.className)} style={{width, height, fontSize, fontWeight}}>
      <Icon ref="icon" {...site} width={width} />
    </div>);
  }
});

SiteIcon.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  site: React.PropTypes.shape({
    title: React.PropTypes.string,
    provider_name: React.PropTypes.string,
    provider_display: React.PropTypes.string,
    icons: React.PropTypes.array,
    favicon_colors: React.PropTypes.array
  }).isRequired
};

module.exports = SiteIcon;
module.exports = Object.assign(module.exports, {
  SiteIconImage,
  SiteIconFallback,
  getSiteImage,
  DEFAULT_FALLBACK_BG_COLOR
});
