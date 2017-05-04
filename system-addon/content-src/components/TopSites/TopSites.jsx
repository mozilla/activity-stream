const React = require("react");
const {connect} = require("react-redux");
const shortURL = require("content-src/lib/short-url");

const TopSite = props => {
  const title = shortURL(props);
  const className = `screenshot${props.screenshot ? " active" : ""}`;
  const style = {backgroundImage: props.screenshot ? `url(${props.screenshot})` : "none"};
  return (<li className="top-site">
    <a href={props.url}>
      <div className="tile" aria-hidden={true}>
        <span className="letter-fallback">{title[0]}</span>
        <div className={className} style={style} />
      </div>
      <div className="title">{title}</div>
    </a>
  </li>);
};

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map(link => <TopSite key={link.url} {...link} />)}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
module.exports._unconnected = TopSites;
module.exports.TopSite = TopSite;
