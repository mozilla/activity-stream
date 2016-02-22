const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {NotifyTelemetry} = require("actions/action-manager").actions;
const {connect} = require("react-redux");

const SpotlightItem = React.createClass({
  sendTelemetry() {
    this.props.dispatch(NotifyTelemetry({
      event: "CLICK_SPOTLIGHT",
      index: this.props.index
    }));
  },
  render() {
    const site = this.props;
    const imageUrl = site.images[0].url;
    const description = site.description;
    return (<li className="spotlight-item">
      <a href={site.url} ref="link" onClick={this.sendTelemetry}>
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

module.exports = connect()(SpotlightItem);
