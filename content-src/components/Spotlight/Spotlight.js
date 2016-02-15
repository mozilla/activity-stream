const React = require("react");

const SpotlightItem = React.createClass({
  render() {
    const site = this.props;
    return (<li className="spotlight-item">
      <div className="spotlight-image" style={{backgroundImage: `url(${ site.image })`}} ref="image">
        <div className="spotlight-icon" style={{backgroundImage: `url(${ site.icon })`}} ref="icon" />
      </div>
      <div className="spotlight-details">
        <div className="spotlight-info">
          <h4 className="spotlight-title">
            <a href={site.url} ref="link">{site.title}</a>
          </h4>
          <p className="spotlight-description" ref="description">{site.description}</p>
          <div className="spotlight-type">Last opened on iPhone</div>
        </div>
      </div>
    </li>);
  }
});

SpotlightItem.propTypes = {
  url: React.PropTypes.string.isRequired,
  image: React.PropTypes.string.isRequired,
  icon: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string.isRequired,
};

const Spotlight = React.createClass({
  render() {
    const {props} = this;
    return (<section className="spotlight">
      <h3 className="section-title">Spotlight</h3>
      <ul>
        {props.sites.map((site) => <SpotlightItem key={site.url} {...site} />)}
      </ul>
    </section>);
  }
});

Spotlight.propTypes = {
  sites: React.PropTypes.array.isRequired
};

module.exports = Spotlight;
module.exports.SpotlightItem = SpotlightItem;
