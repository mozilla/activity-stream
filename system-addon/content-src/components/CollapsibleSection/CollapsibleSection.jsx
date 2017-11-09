const React = require("react");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {injectIntl, FormattedMessage} = require("react-intl");

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

function getFormattedMessage(message) {
  return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
}
function getCollapsed(props) {
  return props.Prefs.values[props.prefName];
}

class Info extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onInfoEnter = this.onInfoEnter.bind(this);
    this.onInfoLeave = this.onInfoLeave.bind(this);
    this.onManageClick = this.onManageClick.bind(this);
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
  onManageClick() {
    this.props.dispatch({type: at.SETTINGS_OPEN});
    this.props.dispatch(ac.UserEvent({event: "OPEN_NEWTAB_PREFS"}));
  }
  render() {
    const {infoOption, intl} = this.props;
    const infoOptionIconA11yAttrs = {
      "aria-haspopup": "true",
      "aria-controls": "info-option",
      "aria-expanded": this.state.infoActive ? "true" : "false",
      "role": "note",
      "tabIndex": 0
    };
    const sectionInfoTitle = intl.formatMessage({id: "section_info_option"});

    return (
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
              {getFormattedMessage(infoOption.header)}
            </div>}
          <p className="info-option-body">
            {infoOption.body && getFormattedMessage(infoOption.body)}
            {infoOption.link &&
              <a href={infoOption.link.href} target="_blank" rel="noopener noreferrer" className="info-option-link">
                {getFormattedMessage(infoOption.link.title || infoOption.link)}
              </a>
            }
          </p>
          <div className="info-option-manage">
            <button onClick={this.onManageClick}>
              <FormattedMessage id="settings_pane_header" />
            </button>
          </div>
        </div>
      </span>
    );
  }
}

const InfoIntl = injectIntl(Info);

class Disclaimer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onAcknowledge = this.onAcknowledge.bind(this);
  }

  onAcknowledge() {
    this.props.dispatch(ac.SetPref(this.props.disclaimerPref, false));
    this.props.dispatch(ac.UserEvent({event: "SECTION_DISCLAIMER_ACKNOWLEDGED", source: this.props.eventSource}));
  }

  render() {
    const disclaimer = this.props.disclaimer;
    return (
      <div className="section-disclaimer">
          <div className="section-disclaimer-text">
            {getFormattedMessage(disclaimer.text)}
            {disclaimer.link &&
              <a href={disclaimer.link.href} target="_blank" rel="noopener noreferrer">
                {getFormattedMessage(disclaimer.link.title || disclaimer.link)}
              </a>
            }
          </div>

          <button onClick={this.onAcknowledge}>
            {getFormattedMessage(disclaimer.button)}
          </button>
      </div>
    );
  }
}

const DisclaimerIntl = injectIntl(Disclaimer);

class CollapsibleSection extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onBodyMount = this.onBodyMount.bind(this);
    this.onInfoEnter = this.onInfoEnter.bind(this);
    this.onInfoLeave = this.onInfoLeave.bind(this);
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.enableOrDisableAnimation = this.enableOrDisableAnimation.bind(this);
    this.state = {enableAnimation: true, isAnimating: false, infoActive: false};
  }

  componentWillMount() {
    this.props.document.addEventListener(VISIBILITY_CHANGE_EVENT, this.enableOrDisableAnimation);
  }
  componentWillUpdate(nextProps) {
    // Check if we're about to go from expanded to collapsed
    if (!getCollapsed(this.props) && getCollapsed(nextProps)) {
      // This next line forces a layout flush of the section body, which has a
      // max-height style set, so that the upcoming collapse animation can
      // animate from that height to the collapsed height. Without this, the
      // update is coalesced and there's no animation from no-max-height to 0.
      this.sectionBody.scrollHeight; // eslint-disable-line no-unused-expressions
    }
  }
  componentWillUnmount() {
    this.props.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this.enableOrDisableAnimation);
  }
  enableOrDisableAnimation() {
    // Only animate the collapse/expand for visible tabs.
    const visible = this.props.document.visibilityState === VISIBLE;
    if (this.state.enableAnimation !== visible) {
      this.setState({enableAnimation: visible});
    }
  }
  _setInfoState(nextActive) {
    // Take a truthy value to conditionally change the infoActive state.
    const infoActive = !!nextActive;
    if (infoActive !== this.state.infoActive) {
      this.setState({infoActive});
    }
  }
  onBodyMount(node) {
    this.sectionBody = node;
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
  onHeaderClick() {
    // Get the current height of the body so max-height transitions can work
    this.setState({
      isAnimating: true,
      maxHeight: `${this.sectionBody.scrollHeight}px`
    });
    this.props.dispatch(ac.SetPref(this.props.prefName, !getCollapsed(this.props)));
  }
  onTransitionEnd(event) {
    // Only update the animating state for our own transition (not a child's)
    if (event.target === event.currentTarget) {
      this.setState({isAnimating: false});
    }
  }
  renderIcon() {
    const icon = this.props.icon;
    if (icon && icon.startsWith("moz-extension://")) {
      return <span className="icon icon-small-spacer" style={{backgroundImage: `url('${icon}')`}} />;
    }
    return <span className={`icon icon-small-spacer icon-${icon || "webextension"}`} />;
  }
  render() {
    const isCollapsed = getCollapsed(this.props);
    const {enableAnimation, isAnimating, maxHeight} = this.state;
    const {id, infoOption, eventSource, disclaimer} = this.props;
    const disclaimerPref = `section.${id}.showDisclaimer`;
    const needsDisclaimer = disclaimer && this.props.Prefs.values[disclaimerPref];

    return (
      <section className={`collapsible-section ${this.props.className}${enableAnimation ? " animation-enabled" : ""}${isCollapsed ? " collapsed" : ""}`}>
        <div className="section-top-bar">
          <h3 className="section-title">
            <span className="click-target" onClick={this.onHeaderClick}>
              {this.renderIcon()}
              {this.props.title}
            <span className={`icon ${isCollapsed ? "icon-arrowhead-forward" : "icon-arrowhead-down"}`} />
            </span>
          </h3>
          {infoOption && <InfoIntl infoOption={infoOption} dispatch={this.props.dispatch} />}
        </div>
        <div
          className={`section-body${isAnimating ? " animating" : ""}`}
          onTransitionEnd={this.onTransitionEnd}
          ref={this.onBodyMount}
          style={isAnimating && !isCollapsed ? {maxHeight} : null}>
          {needsDisclaimer && <DisclaimerIntl disclaimerPref={disclaimerPref} disclaimer={disclaimer} eventSource={eventSource} dispatch={this.props.dispatch} />}
          {this.props.children}
        </div>
      </section>
    );
  }
}

CollapsibleSection.defaultProps = {
  document: global.document || {
    addEventListener: () => {},
    removeEventListener: () => {},
    visibilityState: "hidden"
  },
  Prefs: {values: {}}
};

module.exports = injectIntl(CollapsibleSection);
module.exports._unconnected = CollapsibleSection;
module.exports.Info = Info;
module.exports.InfoIntl = InfoIntl;
module.exports.Disclaimer = Disclaimer;
module.exports.DisclaimerIntl = DisclaimerIntl;
