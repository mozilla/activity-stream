const React = require("react");

const TopSites = React.createClass({
  render() {
    const props = this.props;
    return (<section className="top-sites">
      <div>Top Sites</div>
      {props.sites.map((site) => (<a className="tile" href={site.url}>
        <div className="tile-img-container">
          {(site.leadImage || site.image) && <div className="tile-img"
            style={{backgroundImage: `url(${site.leadImage || site.image})`}} />}
        </div>
        <div className="tile-title">
          {site.title}
        </div>
      </a>))}
    </section>);
  }
});

TopSites.propTypes = {
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      title: React.PropTypes.string.isRequired,
      image: React.PropTypes.string,
      leadImage: React.PropTypes.string,
      url: React.PropTypes.string.isRequired,
      type: React.PropTypes.string,
      description: React.PropTypes.string
    })
  ).isRequired
};

module.exports = TopSites;
