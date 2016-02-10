const React = require("react");

class TopSites extends React.Component {
  static get propTypes() {
    return {
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
  }

  render() {
    const props = this.props;
    return (<section className="top-sites">
      <h3 className="section-title">Top Sites</h3>
      <div className="tiles-wrapper">
        {props.sites.map((site) => (<a key={site.url} className="tile" href={site.url}>
          <div className="tile-img-container">
            {(site.leadImage || site.image) && <div className="tile-img"
              style={{backgroundImage: `url(${site.leadImage || site.image})`}} />}
          </div>
          <div className="tile-title">
            {site.title}
          </div>
        </a>))}
      </div>
    </section>);
  }
}

module.exports = TopSites;
