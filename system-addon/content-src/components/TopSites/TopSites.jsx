const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");

const TopSitesEdit = require("./TopSitesEdit");
const {TopSite, TopSitePlaceholder} = require("./TopSite");
const CollapsibleSection = require("content-src/components/CollapsibleSection/CollapsibleSection");
const {InfoIntl} = require("content-src/components/Sections/Sections");
const ComponentPerfTimer = require("content-src/components/ComponentPerfTimer/ComponentPerfTimer");

const TopSites = props => {
  const realTopSites = props.TopSites.rows.slice(0, props.TopSitesCount);
  const placeholderCount = props.TopSitesCount - realTopSites.length;
  const infoOption = {
    header: {id: "settings_pane_topsites_header"},
    body: {id: "settings_pane_topsites_body"}
  };
  return (
    <CollapsibleSection className="top-sites" icon="topsites" title={<FormattedMessage id="header_top_sites" />} infoOption={infoOption} prefName="collapseTopSites" Prefs={props.Prefs} dispatch={props.dispatch}>
      <ComponentPerfTimer id="topsites" initialized={props.TopSites.initialized} dispatch={props.dispatch}>
        <section className="section top-sites">
          <div className="section-top-bar">
            <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
            <InfoIntl infoOption={infoOption} dispatch={props.dispatch} />
          </div>
          <ul className="top-sites-list">
            {realTopSites.map((link, index) => link && <TopSite
              key={link.guid || link.url}
              dispatch={props.dispatch}
              link={link}
              index={index}
              intl={props.intl} />)}
            {placeholderCount > 0 && [...Array(placeholderCount)].map((_, i) => <TopSitePlaceholder key={i} />)}
          </ul>
          <TopSitesEdit {...props} />
        </section>
      </ComponentPerfTimer>
    </CollapsibleSection>);
};

module.exports = connect(state => ({TopSites: state.TopSites, Prefs: state.Prefs, TopSitesCount: state.Prefs.values.topSitesCount}))(TopSites);
module.exports._unconnected = TopSites;
