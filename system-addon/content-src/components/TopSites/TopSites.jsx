const React = require("react");
const {connect} = require("react-redux");

function displayURL(url) {
  return new URL(url).hostname.replace(/^www./, "");
}

const TopSites = props => (<section>
  <h3 className="section-title">Top Sites</h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map(link => {
      const title = displayURL(link.url);
      const className = `screenshot${link.screenshot ? " active" : ""}`;
      const style = {backgroundImage: (link.screenshot ? `url(${link.screenshot})` : "none")};
      return (<li key={link.url}>
        <a href={link.url}>
          <div className="tile">
            <span className="letter-fallback" ariaHidden={true}>{title[0]}</span>
            <div className={className} style={style} />
          </div>
          <div className="title">{title}</div>
        </a>
      </li>);
    })}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
