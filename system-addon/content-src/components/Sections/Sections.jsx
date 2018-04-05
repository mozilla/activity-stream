import {Card, PlaceholderCard} from "content-src/components/Card/Card";
import {FormattedMessage, injectIntl} from "react-intl";
import {actionCreators as ac} from "common/Actions.jsm";
import {CollapsibleSection} from "content-src/components/CollapsibleSection/CollapsibleSection";
import {ComponentPerfTimer} from "content-src/components/ComponentPerfTimer/ComponentPerfTimer";
import {connect} from "react-redux";
import React from "react";
import {Topics} from "content-src/components/Topics/Topics";
import {TopSites} from "content-src/components/TopSites/TopSites";

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";
const CARDS_PER_ROW = 3;

function getFormattedMessage(message) {
  return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
}

export class Section extends React.PureComponent {
  _dispatchImpressionStats() {
    const {props} = this;
    const maxCards = 3 * props.maxRows;
    const cards = props.rows.slice(0, maxCards);

    if (this.needsImpressionStats(cards)) {
      props.dispatch(ac.ImpressionStats({
        source: props.eventSource,
        tiles: cards.map(link => ({id: link.guid}))
      }));
      this.impressionCardGuids = cards.map(link => link.guid);
    }
  }

  // This sends an event when a user sees a set of new content. If content
  // changes while the page is hidden (i.e. preloaded or on a hidden tab),
  // only send the event if the page becomes visible again.
  sendImpressionStatsOrAddListener() {
    const {props} = this;

    if (!props.shouldSendImpressionStats || !props.dispatch) {
      return;
    }

    if (props.document.visibilityState === VISIBLE) {
      this._dispatchImpressionStats();
    } else {
      // We should only ever send the latest impression stats ping, so remove any
      // older listeners.
      if (this._onVisibilityChange) {
        props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
      }

      // When the page becomes visible, send the impression stats ping if the section isn't collapsed.
      this._onVisibilityChange = () => {
        if (props.document.visibilityState === VISIBLE) {
          if (!this.props.pref.collapsed) {
            this._dispatchImpressionStats();
          }
          props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
        }
      };
      props.document.addEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }

  componentDidMount() {
    if (this.props.rows.length && !this.props.pref.collapsed) {
      this.sendImpressionStatsOrAddListener();
    }
  }

  componentDidUpdate(prevProps) {
    const {props} = this;
    const isCollapsed = props.pref.collapsed;
    const wasCollapsed = prevProps.pref.collapsed;
    if (
      // Don't send impression stats for the empty state
      props.rows.length &&
      (
        // We only want to send impression stats if the content of the cards has changed
        // and the section is not collapsed...
        (props.rows !== prevProps.rows && !isCollapsed) ||
        // or if we are expanding a section that was collapsed.
        (wasCollapsed && !isCollapsed)
      )
    ) {
      this.sendImpressionStatsOrAddListener();
    }
  }

  componentWillUnmount() {
    if (this._onVisibilityChange) {
      this.props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }

  needsImpressionStats(cards) {
    if (!this.impressionCardGuids || (this.impressionCardGuids.length !== cards.length)) {
      return true;
    }

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].guid !== this.impressionCardGuids[i]) {
        return true;
      }
    }

    return false;
  }

  numberOfPlaceholders(items) {
    if (items === 0) {
      return CARDS_PER_ROW;
    }
    const remainder = items % CARDS_PER_ROW;
    if (remainder === 0) {
      return 0;
    }
    return CARDS_PER_ROW - remainder;
  }

  render() {
    const {
      id, eventSource, title, icon, rows,
      emptyState, dispatch, maxRows,
      contextMenuOptions, initialized, disclaimer,
      pref, privacyNoticeURL, isFirst, isLast
    } = this.props;
    const maxCards = CARDS_PER_ROW * maxRows;

    // Show topics only for top stories and if it's not initialized yet (so
    // content doesn't shift when it is loaded) or has loaded with topics
    const shouldShowTopics = (id === "topstories" &&
      (!this.props.topics || this.props.topics.length > 0));

    const realRows = rows.slice(0, maxCards);
    const placeholders = this.numberOfPlaceholders(realRows.length);

    // The empty state should only be shown after we have initialized and there is no content.
    // Otherwise, we should show placeholders.
    const shouldShowEmptyState = initialized && !rows.length;

    // <Section> <-- React component
    // <section> <-- HTML5 element
    return (<ComponentPerfTimer {...this.props}>
      <CollapsibleSection className="section" icon={icon}
        title={title}
        id={id}
        eventSource={eventSource}
        disclaimer={disclaimer}
        collapsed={this.props.pref.collapsed}
        showPrefName={(pref && pref.feed) || id}
        privacyNoticeURL={privacyNoticeURL}
        Prefs={this.props.Prefs}
        isFirst={isFirst}
        isLast={isLast}
        dispatch={this.props.dispatch}>

        {!shouldShowEmptyState && (<ul className="section-list" style={{padding: 0}}>
          {realRows.map((link, index) => link &&
            <Card key={index} index={index} dispatch={dispatch} link={link} contextMenuOptions={contextMenuOptions}
              eventSource={eventSource} shouldSendImpressionStats={this.props.shouldSendImpressionStats} isWebExtension={this.props.isWebExtension} />)}
          {placeholders > 0 && [...new Array(placeholders)].map((_, i) => <PlaceholderCard key={i} />)}
        </ul>)}
        {shouldShowEmptyState &&
          <div className="section-empty-state">
            <div className="empty-state">
              {emptyState.icon && emptyState.icon.startsWith("moz-extension://") ?
                <img className="empty-state-icon icon" style={{"background-image": `url('${emptyState.icon}')`}} /> :
                <img className={`empty-state-icon icon icon-${emptyState.icon}`} />}
              <p className="empty-state-message">
                {getFormattedMessage(emptyState.message)}
              </p>
            </div>
          </div>}
        {shouldShowTopics && <Topics topics={this.props.topics} read_more_endpoint={this.props.read_more_endpoint} />}
      </CollapsibleSection>
    </ComponentPerfTimer>);
  }
}

Section.defaultProps = {
  document: global.document,
  rows: [],
  emptyState: {},
  pref: {},
  title: ""
};

export const SectionIntl = connect(state => ({Prefs: state.Prefs}))(injectIntl(Section));

export class _Sections extends React.PureComponent {
  renderSections() {
    const sections = [];
    const enabledSections = this.props.Sections.filter(section => section.enabled);
    const {sectionOrder} = this.props.Prefs.values;
    const showTopSites = this.props.Prefs.values["feeds.topsites"];
    // Enabled sections doesn't include Top Sites, so we add it if enabled.
    const expectedCount = enabledSections.length + ~~showTopSites;

    for (const sectionId of sectionOrder.split(",")) {
      const commonProps = {
        key: sectionId,
        isFirst: sections.length === 0,
        isLast: sections.length === expectedCount - 1
      };
      if (sectionId === "topsites" && showTopSites) {
        sections.push(<TopSites {...commonProps} />);
      } else {
        const section = enabledSections.find(s => s.id === sectionId);
        if (section) {
          sections.push(<SectionIntl {...section} {...commonProps} />);
        }
      }
    }
    return sections;
  }

  render() {
    return (
      <div className="sections-list">
        {this.renderSections()}
      </div>
    );
  }
}

export const Sections = connect(state => ({Sections: state.Sections, Prefs: state.Prefs}))(_Sections);
