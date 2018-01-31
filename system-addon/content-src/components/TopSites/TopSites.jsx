import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {FormattedMessage, injectIntl} from "react-intl";
import {MIN_CORNER_FAVICON_SIZE, MIN_RICH_FAVICON_SIZE, TOP_SITES_SOURCE} from "./TopSitesConstants";
import {CollapsibleSection} from "content-src/components/CollapsibleSection/CollapsibleSection";
import {ComponentPerfTimer} from "content-src/components/ComponentPerfTimer/ComponentPerfTimer";
import {connect} from "react-redux";
import React from "react";
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
  static get DEFAULT_STATE() {
    return {
      showAddForm: false,
      editIndex: -1 // Index of top site being edited
    };
  }

  constructor(props) {
    super(props);
    this.state = _TopSites.DEFAULT_STATE;
    this.onAddButtonClick = this.onAddButtonClick.bind(this);
    this.onFormClose = this.onFormClose.bind(this);
  }

  /**
   * Dispatch session statistics about the quality of TopSites icons and pinned count.
   */
  _dispatchTopSitesStats() {
    const topSites = this._getTopSites();
    const topSitesIconsStats = countTopSitesIconsTypes(topSites);
    const topSitesPinned = topSites.filter(site => !!site.isPinned).length;
    // Dispatch telemetry event with the count of TopSites images types.
    this.props.dispatch(ac.SendToMain({
      type: at.SAVE_SESSION_PERF_DATA,
      data: {topsites_icon_stats: topSitesIconsStats, topsites_pinned: topSitesPinned}
    }));
  }

  /**
   * Return the TopSites to display based on prefs.
   */
  _getTopSites() {
    return this.props.TopSites.rows.slice(0, this.props.TopSitesCount);
  }

  componentDidUpdate() {
    this._dispatchTopSitesStats();
  }

  componentDidMount() {
    this._dispatchTopSitesStats();
  }

  onAddButtonClick() {
    this.setState({showAddForm: true});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_ADD_FORM_OPEN"
    }));
  }

  onFormClose() {
    this.setState(_TopSites.DEFAULT_STATE);
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_CLOSE"
    }));
    this.props.dispatch({type: at.TOP_SITES_CANCEL_EDIT});
  }

  render() {
    const {props} = this;
    const infoOption = {
      header: {id: "settings_pane_topsites_header"},
      body: {id: "settings_pane_topsites_body"}
    };
    const {showAddForm} = this.state;
    const {editForm} = this.props.TopSites;
    let {editIndex} = this.state;
    if (editIndex < 0 && editForm) {
      editIndex = editForm.index;
    }
    const editSite = this.props.TopSites.rows[editIndex] || {};
    return (<ComponentPerfTimer id="topsites" initialized={props.TopSites.initialized} dispatch={props.dispatch}>
      <CollapsibleSection className="top-sites" icon="topsites" title={<FormattedMessage id="header_top_sites" />} infoOption={infoOption} prefName="collapseTopSites" Prefs={props.Prefs} dispatch={props.dispatch}>
        <TopSiteList TopSites={props.TopSites} TopSitesCount={props.TopSitesCount} dispatch={props.dispatch} intl={props.intl} />
        <div className="edit-topsites-wrapper">
          <div className="add-topsites-button">
            <button
              className="add"
              title={this.props.intl.formatMessage({id: "edit_topsites_add_button_tooltip"})}
              onClick={this.onAddButtonClick}>
              <FormattedMessage id="edit_topsites_add_button" />
            </button>
          </div>
          {(showAddForm || editIndex >= 0) &&
            <div className="edit-topsites">
              <div className="modal-overlay" onClick={this.onFormClose} />
              <div className="modal">
                <TopSiteForm
                  label={editSite.label || editSite.hostname || ""}
                  url={editSite.url || ""}
                  index={editIndex}
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
  TopSitesCount: state.Prefs.values.topSitesCount
}))(injectIntl(_TopSites));
