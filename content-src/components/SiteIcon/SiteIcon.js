const React = require("react");
const classNames = require("classnames");
const {selectSiteIcon} = require("selectors/selectors");

const SiteIcon = React.createClass({
  getDefaultProps() {
    return {
      site: {},
      height: null,
      width: null,
      faviconSize: 16,
      showTitle: false,
      showBackground: true,
      border: true
    };
  },
  render() {
    const site = selectSiteIcon(this.props.site);
    const {width, height, faviconSize, showTitle} = this.props;
    const showFallback = !site.favicon;
    const showBackground = this.props.showBackground || showFallback;
    const showBorder = this.props.border;

    const fontSize = faviconSize * 0.9;
    const fontWeight = (fontSize > 20) ? 200 : 400;
    const fallbackStyle = {
      color: site.fontColor,
      fontSize,
      fontWeight
    };
    const style = {width, height, backgroundColor: showBackground && "white"};
    return (<div className={classNames("site-icon", this.props.className)} style={style}>
      <div ref="background" hidden={!showBackground} className="site-icon-background" style={{backgroundColor: site.backgroundColor}} />
      <div ref="border" hidden={!showBackground || !showBorder} className="inner-border" />
      <div className="site-icon-wrapper">
        <img ref="favicon" width={faviconSize} height={faviconSize} className="site-icon-favicon" hidden={showFallback} src={site.favicon} />
        <span ref="fallback" className="site-icon-fallback" style={fallbackStyle} hidden={!showFallback} data-first-letter={site.firstLetter} />
      </div>
      <div ref="title" hidden={!showTitle} className="site-icon-title">{site.label}</div>
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
