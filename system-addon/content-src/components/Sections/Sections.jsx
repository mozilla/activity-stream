const React = require("react");
const {connect} = require("react-redux");
const {injectIntl, FormattedMessage} = require("react-intl");
const Card = require("content-src/components/Card/Card");
const {PlaceholderCard} = Card;
const Topics = require("content-src/components/Topics/Topics");
const {actionCreators: ac} = require("common/Actions.jsm");
const CollapsibleSection = require("content-src/components/CollapsibleSection/CollapsibleSection");
const SectionsPerfTimer = require("./SectionsPerfTimer");

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";
const CARDS_PER_ROW = 3;

function getFormattedMessage(message) {
  return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
}

class Section extends React.PureComponent {
  _dispatchImpressionStats() {
    const {props} = this;
    const maxCards = 3 * props.maxRows;
    const cards = props.rows.slice(0, maxCards);

    if (this.needsImpressionStats(cards)) {
      props.dispatch(ac.ImpressionStats({
        source: props.eventSource,
        tiles: cards.map(link => ({id: link.guid})),
        incognito: props.options && props.options.personalized
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

      // When the page becoems visible, send the impression stats ping if the section isn't collapsed.
      this._onVisibilityChange = () => {
        if (props.document.visibilityState === VISIBLE) {
          const {id, Prefs} = this.props;
          const isCollapsed = Prefs.values[`section.${id}.collapsed`];
          if (!isCollapsed) {
            this._dispatchImpressionStats();
          }
          props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
        }
      };
      props.document.addEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }

  componentDidMount() {
    const {id, rows, Prefs} = this.props;
    const isCollapsed = Prefs.values[`section.${id}.collapsed`];
    if (rows.length && !isCollapsed) {
      this.sendImpressionStatsOrAddListener();
    }
  }

  componentDidUpdate(prevProps) {
    const {props} = this;
    const {id, Prefs} = props;
    const isCollapsedPref = `section.${id}.collapsed`;
    const isCollapsed = Prefs.values[isCollapsedPref];
    const wasCollapsed = prevProps.Prefs.values[isCollapsedPref];
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
      infoOption, emptyState, dispatch, maxRows,
      contextMenuOptions, initialized
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
    return (
      <CollapsibleSection className="section" icon={icon} title={getFormattedMessage(title)} infoOption={infoOption} prefName={`section.${id}.collapsed`} Prefs={this.props.Prefs} dispatch={this.props.dispatch}>
        <SectionsPerfTimer {...this.props}>
          <section className="section">
            <div className="section-top-bar">
              <h3 className="section-title">
                {icon && icon.startsWith("moz-extension://") ?
                  <span className="icon icon-small-spacer" style={{ "background-image": `url('${icon}')` }} /> :
                  <span className={`icon icon-small-spacer icon-${icon || "webextension"}`} />}
                {getFormattedMessage(title)}
              </h3>
              {infoOption && <InfoIntl infoOption={infoOption} dispatch={dispatch} />}
            </div>
            {!shouldShowEmptyState && (<ul className="section-list" style={{ padding: 0 }}>
              {realRows.map((link, index) => link &&
                <Card key={index} index={index} dispatch={dispatch} link={link} contextMenuOptions={contextMenuOptions}
                  eventSource={eventSource} shouldSendImpressionStats={this.props.shouldSendImpressionStats} />)}
              {placeholders > 0 && [...new Array(placeholders)].map((_, i) => <PlaceholderCard key={i} />)}
            </ul>)}
            {shouldShowEmptyState &&
              <div className="section-empty-state">
                <div className="empty-state">
                  {emptyState.icon && emptyState.icon.startsWith("moz-extension://") ?
                    <img className="empty-state-icon icon" style={{ "background-image": `url('${emptyState.icon}')` }} /> :
                    <img className={`empty-state-icon icon icon-${emptyState.icon}`} />}
                  <p className="empty-state-message">
                    {getFormattedMessage(emptyState.message)}
                  </p>
                </div>
              </div>}
            {shouldShowTopics && <Topics topics={this.props.topics} read_more_endpoint={this.props.read_more_endpoint} />}
          </section>
        </SectionsPerfTimer>
      </CollapsibleSection>);
  }
}

Section.defaultProps = {
  document: global.document,
  rows: [],
  emptyState: {},
  title: ""
};

const SectionIntl = injectIntl(Section);

class Sections extends React.PureComponent {
  render() {
    const sections = this.props.Sections;
    return (
      <div className="sections-list">
        {sections
          .filter(section => section.enabled)
          .map(section => <SectionIntl key={section.id} {...section} Prefs={this.props.Prefs} dispatch={this.props.dispatch} />)}
      </div>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections, Prefs: state.Prefs}))(Sections);
module.exports._unconnected = Sections;
module.exports.SectionIntl = SectionIntl;
module.exports._unconnectedSection = Section;
