const React = require("react");
const Base = props => (<div>
  <h1>New Tab</h1>
  <ul>
    {props.TopSites.rows.map(link => <li key={link.url}><a href={link.url}>{link.title}</a></li>)}
  </ul>
</div>);
module.exports = Base;
