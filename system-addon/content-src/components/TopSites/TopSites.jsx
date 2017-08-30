const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");

const TopSitesPerfTimer = require("./TopSitesPerfTimer");
const TopSitesEdit = require("./TopSitesEdit");
const TopSite = require("./TopSite");

const TopSites = props => (<TopSitesPerfTimer>
  <section className="top-sites">
    <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
    <ul className="top-sites-list">
      {props.TopSites.rows.slice(0, props.TopSitesCount).map((link, index) => link && <TopSite
        key={link.guid || link.url}
        dispatch={props.dispatch}
        link={link}
        index={index}
        intl={props.intl} />)}
    </ul>
    <TopSitesEdit {...props} />
  </section>
</TopSitesPerfTimer>);

module.exports = connect(state => ({TopSites: state.TopSites, TopSitesCount: state.Prefs.values.topSitesCount}))(TopSites);
module.exports._unconnected = TopSites;
