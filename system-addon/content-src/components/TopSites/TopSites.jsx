import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {FormattedMessage, injectIntl} from "react-intl";
import {MIN_CORNER_FAVICON_SIZE, MIN_RICH_FAVICON_SIZE, TOP_SITES_SOURCE} from "./TopSitesConstants";
import {CollapsibleSection} from "content-src/components/CollapsibleSection/CollapsibleSection";
import {ComponentPerfTimer} from "content-src/components/ComponentPerfTimer/ComponentPerfTimer";
import {connect} from "react-redux";
import React from "react";
import {TOP_SITES_MAX_SITES_PER_ROW} from "common/Reducers.jsm";
import {TopSiteForm} from "./TopSiteForm";
import {TopSiteList} from "./TopSite";

/**
 * Iterates through TopSites and counts types of images.
 * @param acc Accumulator for reducer.
 * @param topsite Entry in TopSites.
 */
function countTopSitesIconsTypes(topSites) {
  const countTopSitesTypes = (acc, link) => {
    if (link.tippyTopIcon || link.faviconRef === "tippytop") {
      acc.tippytop++;
    } else if (link.faviconSize >= MIN_RICH_FAVICON_SIZE) {
      acc.rich_icon++;
    } else if (link.screenshot && link.faviconSize >= MIN_CORNER_FAVICON_SIZE) {
      acc.screenshot_with_icon++;
    } else if (link.screenshot) {
      acc.screenshot++;
    } else {
      acc.no_image++;
    }

    return acc;
  };

  return topSites.reduce(countTopSitesTypes, {
    "screenshot_with_icon": 0,
    "screenshot": 0,
    "tippytop": 0,
    "rich_icon": 0,
    "no_image": 0
  });
}

export class _TopSites extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onFormClose = this.onFormClose.bind(this);
  }

  /**
   * Dispatch session statistics about the quality of TopSites icons and pinned count.
   */
  _dispatchTopSitesStats() {
    const topSites = this._getVisibleTopSites();
    const topSitesIconsStats = countTopSitesIconsTypes(topSites);
    const topSitesPinned = topSites.filter(site => !!site.isPinned).length;
    // Dispatch telemetry event with the count of TopSites images types.
    this.props.dispatch(ac.AlsoToMain({
      type: at.SAVE_SESSION_PERF_DATA,
      data: {topsites_icon_stats: topSitesIconsStats, topsites_pinned: topSitesPinned}
    }));
  }

  /**
   * Return the TopSites that are visible based on prefs and window width.
   */
  _getVisibleTopSites() {
    // We hide 2 sites per row when not in the wide layout.
    let sitesPerRow = TOP_SITES_MAX_SITES_PER_ROW;
    // $break-point-widest = 1072px (from _variables.scss)
    if (!global.matchMedia(`(min-width: 1072px)`).matches) {
      sitesPerRow -= 2;
    }
    return this.props.TopSites.rows.slice(0, this.props.TopSitesRows * sitesPerRow);
  }

  componentDidUpdate() {
    this._dispatchTopSitesStats();
  }

  componentDidMount() {
    this._dispatchTopSitesStats();
  }

  onFormClose() {
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_CLOSE"
    }));
    this.props.dispatch({type: at.TOP_SITES_CANCEL_EDIT});
  }

  render() {
    const {props} = this;
    const {editForm} = props.TopSites;

    return (<ComponentPerfTimer id="topsites" initialized={props.TopSites.initialized} dispatch={props.dispatch}>
      <CollapsibleSection className="top-sites" icon="topsites" title={<FormattedMessage id="header_top_sites" />} prefName="collapseTopSites" Prefs={props.Prefs} dispatch={props.dispatch}>
        <TopSiteList TopSites={props.TopSites} TopSitesRows={props.TopSitesRows} dispatch={props.dispatch} intl={props.intl} />
        <div className="edit-topsites-wrapper">
          {editForm &&
            <div className="edit-topsites">
              <div className="modal-overlay" onClick={this.onFormClose} />
              <div className="modal">
                <TopSiteForm
                  site={props.TopSites.rows[editForm.index]}
                  index={editForm.index}
                  onClose={this.onFormClose}
                  dispatch={this.props.dispatch}
                  intl={this.props.intl} />
              </div>
            </div>
          }
        </div>
      </CollapsibleSection>
    </ComponentPerfTimer>);
  }
}

export const TopSites = connect(state => ({
  TopSites: state.TopSites,
  Prefs: state.Prefs,
  TopSitesRows: state.Prefs.values.topSitesRows
}))(injectIntl(_TopSites));
