const React = require("react");
const {connect} = require("react-redux");

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map(link => <li key={link.url}><a href={link.url}>{link.title}</a></li>)}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
