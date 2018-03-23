import {FormattedMessage, injectIntl} from "react-intl";
import {actionCreators as ac} from "common/Actions.jsm";
import {ErrorBoundary} from "content-src/components/ErrorBoundary/ErrorBoundary";
import React from "react";
import {SectionMenu} from "content-src/components/SectionMenu/SectionMenu";

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

function getFormattedMessage(message) {
  return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
}
function getCollapsed(props) {
  return (props.prefName in props.Prefs.values) ? props.Prefs.values[props.prefName] : false;
}

export class Disclaimer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onAcknowledge = this.onAcknowledge.bind(this);
  }

  onAcknowledge() {
    this.props.dispatch(ac.SetPref(this.props.disclaimerPref, false));
    this.props.dispatch(ac.UserEvent({event: "SECTION_DISCLAIMER_ACKNOWLEDGED", source: this.props.eventSource}));
  }

  render() {
    const {disclaimer} = this.props;
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

export const DisclaimerIntl = injectIntl(Disclaimer);

export class _CollapsibleSection extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onBodyMount = this.onBodyMount.bind(this);
    this.onHeaderClick = this.onHeaderClick.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.enableOrDisableAnimation = this.enableOrDisableAnimation.bind(this);
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.onMenuButtonMouseEnter = this.onMenuButtonMouseEnter.bind(this);
    this.onMenuButtonMouseLeave = this.onMenuButtonMouseLeave.bind(this);
    this.onMenuUpdate = this.onMenuUpdate.bind(this);
    this.state = {enableAnimation: true, isAnimating: false, menuButtonHover: false, showContextMenu: false};
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

  onBodyMount(node) {
    this.sectionBody = node;
  }

  onHeaderClick() {
    // If this.sectionBody is unset, it means that we're in some sort of error
    // state, probably displaying the error fallback, so we won't be able to
    // compute the height, and we don't want to persist the preference.
    if (!this.sectionBody) {
      return;
    }

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
    const {icon} = this.props;
    if (icon && icon.startsWith("moz-extension://")) {
      return <span className="icon icon-small-spacer" style={{backgroundImage: `url('${icon}')`}} />;
    }
    return <span className={`icon icon-small-spacer icon-${icon || "webextension"}`} />;
  }

  onMenuButtonClick(event) {
    event.preventDefault();
    this.setState({showContextMenu: true});
  }

  onMenuButtonMouseEnter() {
    this.setState({menuButtonHover: true});
  }

  onMenuButtonMouseLeave() {
    this.setState({menuButtonHover: false});
  }

  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }

  render() {
    const isCollapsible = this.props.prefName in this.props.Prefs.values;
    const isCollapsed = getCollapsed(this.props);
    const {enableAnimation, isAnimating, maxHeight, menuButtonHover, showContextMenu} = this.state;
    const {id, eventSource, disclaimer, title, extraMenuOptions, prefName, showPrefName, privacyNoticeURL, dispatch, isFirst, isLast} = this.props;
    const disclaimerPref = `section.${id}.showDisclaimer`;
    const needsDisclaimer = disclaimer && this.props.Prefs.values[disclaimerPref];
    const active = menuButtonHover || showContextMenu;

    return (
      <section className={`collapsible-section ${this.props.className}${enableAnimation ? " animation-enabled" : ""}${isCollapsed ? " collapsed" : ""}${active ? " active" : ""}`}>
        <div className="section-top-bar">
          <h3 className="section-title">
            <span className="click-target" onClick={isCollapsible && this.onHeaderClick}>
              {this.renderIcon()}
              {getFormattedMessage(title)}
              {isCollapsible && <span className={`collapsible-arrow icon ${isCollapsed ? "icon-arrowhead-forward-small" : "icon-arrowhead-down-small"}`} />}
            </span>
          </h3>
          <div>
            <button
              className="context-menu-button icon"
              onClick={this.onMenuButtonClick}
              onMouseEnter={this.onMenuButtonMouseEnter}
              onMouseLeave={this.onMenuButtonMouseLeave}>
              <span className="sr-only">
                <FormattedMessage id="section_context_menu_button_sr" />
              </span>
            </button>
            {showContextMenu &&
              <SectionMenu
                id={id}
                extraOptions={extraMenuOptions}
                eventSource={eventSource}
                showPrefName={showPrefName}
                collapsePrefName={prefName}
                privacyNoticeURL={privacyNoticeURL}
                isCollapsed={isCollapsed}
                onUpdate={this.onMenuUpdate}
                isFirst={isFirst}
                isLast={isLast}
                dispatch={dispatch} />
            }
          </div>
        </div>
        <ErrorBoundary className="section-body-fallback">
          <div
            className={`section-body${isAnimating ? " animating" : ""}`}
            onTransitionEnd={this.onTransitionEnd}
            ref={this.onBodyMount}
            style={isAnimating && !isCollapsed ? {maxHeight} : null}>
            {needsDisclaimer && <DisclaimerIntl disclaimerPref={disclaimerPref} disclaimer={disclaimer} eventSource={eventSource} dispatch={this.props.dispatch} />}
            {this.props.children}
          </div>
        </ErrorBoundary>
      </section>
    );
  }
}

_CollapsibleSection.defaultProps = {
  document: global.document || {
    addEventListener: () => {},
    removeEventListener: () => {},
    visibilityState: "hidden"
  },
  Prefs: {values: {}}
};

export const CollapsibleSection = injectIntl(_CollapsibleSection);
