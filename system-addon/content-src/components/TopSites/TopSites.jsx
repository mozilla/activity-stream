const React = require("react");
const {connect} = require("react-redux");
const shortURL = require("content-src/lib/short-url");

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map(link => {
      const title = shortURL(link);
      const className = `screenshot${link.screenshot ? " active" : ""}`;
      const style = {backgroundImage: (link.screenshot ? `url(${link.screenshot})` : "none")};
      return (<li key={link.url}>
        <a href={link.url}>
          <div className="tile" aria-hidden={true}>
            <span className="letter-fallback">{title[0]}</span>
            <div className={className} style={style} />
          </div>
          <div className="title">{title}</div>
        </a>
      </li>);
    })}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
module.exports._unconnected = TopSites;
