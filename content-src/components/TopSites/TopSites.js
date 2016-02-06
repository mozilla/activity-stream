const React = require("react");

const TopSites = React.createClass({
  render() {
    const props = this.props;
    return (<section className="top-sites">
      {props.sites.map((site) => (<a className="tile" href={site.url}>
        <div className="tile-img-container">
          {site.image && <div className="tile-img"
            style={{backgroundImage: `url(${site.image.url})`}} />}
          {!site.image && <span className="tile-letter-fallback">{(site.title || site.url)[0]}</span>}
        </div>
        <div className="tile-title">
          {site.title || site.url}
        </div>
      </a>))}
    </section>);
  }
});

TopSites.propTypes = {
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      title: React.PropTypes.string,
      image: React.PropTypes.string,
      leadImage: React.PropTypes.string,
      url: React.PropTypes.string.isRequired,
      type: React.PropTypes.string,
      description: React.PropTypes.string
    })
  ).isRequired
};

module.exports = TopSites;
