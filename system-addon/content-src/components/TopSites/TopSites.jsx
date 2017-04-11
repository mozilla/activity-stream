const React = require("react");
const {connect} = require("react-redux");

function displayURL(url) {
  return new URL(url).hostname.replace(/^www./, "");
}

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map(link => (<li key={link.url}>
      <a href={link.url}>
        <div className="screenshot" style={{backgroundImage: `url(${link.screenshot})`}} />
        <div className="title">{displayURL(link.url)}</div>
      </a>
    </li>))}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
