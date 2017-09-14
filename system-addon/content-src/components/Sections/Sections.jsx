const React = require("react");
const {connect} = require("react-redux");
const {injectIntl, FormattedMessage} = require("react-intl");
const Card = require("content-src/components/Card/Card");
const {PlaceholderCard} = Card;
const Topics = require("content-src/components/Topics/Topics");
const {actionCreators: ac} = require("common/Actions.jsm");

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";
const CARDS_PER_ROW = 3;

class Section extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onInfoEnter = this.onInfoEnter.bind(this);
    this.onInfoLeave = this.onInfoLeave.bind(this);
    this.state = {infoActive: false};
  }

  /**
   * Take a truthy value to conditionally change the infoActive state.
   */
  _setInfoState(nextActive) {
    const infoActive = !!nextActive;
    if (infoActive !== this.state.infoActive) {
      this.setState({infoActive});
    }
  }

  onInfoEnter() {
    // We're getting focus or hover, so info state should be true if not yet.
    this._setInfoState(true);
  }

  onInfoLeave(event) {
    // We currently have an active (true) info state, so keep it true only if we
    // have a related event target that is contained "within" the current target
    // (section-info-option) as itself or a descendant. Set to false otherwise.
    this._setInfoState(event && event.relatedTarget && (
      event.relatedTarget === event.currentTarget ||
      (event.relatedTarget.compareDocumentPosition(event.currentTarget) &
        Node.DOCUMENT_POSITION_CONTAINS)));
  }

  getFormattedMessage(message) {
    return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
  }

  _dispatchImpressionStats() {
    const {props} = this;
    const maxCards = 3 * props.maxRows;
    props.dispatch(ac.ImpressionStats({
      source: props.eventSource,
      tiles: props.rows.slice(0, maxCards).map(link => ({id: link.guid})),
      incognito: props.options && props.options.personalized
    }));
  }

  // This sends an event when a user sees a set of new content. If content
  // changes while the page is hidden (i.e. preloaded or on a hidden tab),
  // only send the event if the page becomes visible again.
  sendImpressionStatsOrAddListener() {
    const {props} = this;

    if (!props.dispatch) {
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

      // When the page becoems visible, send the impression stats ping.
      this._onVisibilityChange = () => {
        if (props.document.visibilityState === VISIBLE) {
          this._dispatchImpressionStats();
          props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
        }
      };
      props.document.addEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }

  componentDidMount() {
    if (this.props.rows.length) {
      this.sendImpressionStatsOrAddListener();
    }
  }

  componentDidUpdate(prevProps) {
    const {props} = this;
    if (
      // Don't send impression stats for the empty state
      props.rows.length &&
      // We only want to send impression stats if the content of the cards has changed
      props.rows !== prevProps.rows
    ) {
      this.sendImpressionStatsOrAddListener();
    }
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
      contextMenuOptions, intl, initialized
    } = this.props;
    const maxCards = CARDS_PER_ROW * maxRows;
    const shouldShowTopics = (id === "topstories" &&
      this.props.topics &&
      this.props.topics.length > 0);

    const infoOptionIconA11yAttrs = {
      "aria-haspopup": "true",
      "aria-controls": "info-option",
      "aria-expanded": this.state.infoActive ? "true" : "false",
      "role": "note",
      "tabIndex": 0
    };

    const sectionInfoTitle = intl.formatMessage({id: "section_info_option"});

    const realRows = rows.slice(0, maxCards);
    const placeholders = this.numberOfPlaceholders(realRows.length);

    // The empty state should only be shown after we have initialized and there is no content.
    // Otherwise, we should show placeholders.
    const shouldShowEmptyState = initialized && !rows.length;

    // <Section> <-- React component
    // <section> <-- HTML5 element
    return (<section>
        <div className="section-top-bar">
          <h3 className="section-title">
            {icon && icon.startsWith("moz-extension://") ?
              <span className="icon icon-small-spacer" style={{"background-image": `url('${icon}')`}} /> :
              <span className={`icon icon-small-spacer icon-${icon || "webextension"}`} />}
            {this.getFormattedMessage(title)}
          </h3>
          {infoOption &&
          <span className="section-info-option"
            onBlur={this.onInfoLeave}
            onFocus={this.onInfoEnter}
            onMouseOut={this.onInfoLeave}
            onMouseOver={this.onInfoEnter}>
            <img className="info-option-icon" title={sectionInfoTitle}
              {...infoOptionIconA11yAttrs} />
            <div className="info-option">
              {infoOption.header &&
                <div className="info-option-header" role="heading">
                  {this.getFormattedMessage(infoOption.header)}
                </div>}
              {infoOption.body &&
                <p className="info-option-body">
                  {this.getFormattedMessage(infoOption.body)}
                </p>}
              {infoOption.link &&
                <a href={infoOption.link.href} target="_blank" rel="noopener noreferrer" className="info-option-link">
                  {this.getFormattedMessage(infoOption.link.title || infoOption.link)}
                </a>}
            </div>
          </span>}
        </div>
        {!shouldShowEmptyState && (<ul className="section-list" style={{padding: 0}}>
          {realRows.map((link, index) => link &&
            <Card key={index} index={index} dispatch={dispatch} link={link} contextMenuOptions={contextMenuOptions} eventSource={eventSource} />)}
          {placeholders > 0 && [...new Array(placeholders)].map((_, i) => <PlaceholderCard key={i} />)}
        </ul>)}
        {shouldShowEmptyState &&
          <div className="section-empty-state">
            <div className="empty-state">
              {emptyState.icon && emptyState.icon.startsWith("moz-extension://") ?
                <img className="empty-state-icon icon" style={{"background-image": `url('${emptyState.icon}')`}} /> :
                <img className={`empty-state-icon icon icon-${emptyState.icon}`} />}
              <p className="empty-state-message">
                {this.getFormattedMessage(emptyState.message)}
              </p>
            </div>
          </div>}
        {shouldShowTopics && <Topics topics={this.props.topics} read_more_endpoint={this.props.read_more_endpoint} />}
      </section>);
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
          .map(section => <SectionIntl key={section.id} {...section} dispatch={this.props.dispatch} />)}
      </div>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.SectionIntl = SectionIntl;
module.exports._unconnectedSection = Section;
