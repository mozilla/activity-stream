import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {ModalOverlayWrapper} from "../../components/ModalOverlay/ModalOverlay";
import {OnboardingCard} from "../OnboardingMessage/OnboardingMessage";
import React from "react";

const FLUENT_FILES = [
  "branding/brand.ftl",
  "browser/branding/sync-brand.ftl",
  // These are finalized strings exposed to localizers
  "browser/newtab/onboarding.ftl",
  // These are WIP/in-development strings that only get used if the string
  // doesn't already exist in onboarding.ftl above
  "trailhead.ftl",
];

export class Trailhead extends React.PureComponent {
  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onInputInvalid = this.onInputInvalid.bind(this);

    this.state = {
      emailInput: "",
      isModalOpen: true,
      flowId: "",
      flowBeginTime: 0,
    };
    this.didFetch = false;
  }

  async componentWillMount() {
    FLUENT_FILES.forEach(file => {
      const link = document.head.appendChild(document.createElement("link"));
      link.href = file;
      link.rel = "localization";
    });

    if (this.props.fxaEndpoint && !this.didFetch) {
      try {
        this.didFetch = true;
        const fxaParams = "entrypoint=activity-stream-firstrun&utm_source=activity-stream&utm_campaign=firstrun&utm_term=trailhead&form_type=email";
        const response = await fetch(`${this.props.fxaEndpoint}/metrics-flow?${fxaParams}`, {credentials: "omit"});
        if (response.status === 200) {
          const {flowId, flowBeginTime} = await response.json();
          this.setState({flowId, flowBeginTime});
        } else {
          this.props.dispatch(ac.OnlyToMain({type: at.TELEMETRY_UNDESIRED_EVENT, data: {event: "FXA_METRICS_FETCH_ERROR", value: response.status}}));
        }
      } catch (error) {
        this.props.dispatch(ac.OnlyToMain({type: at.TELEMETRY_UNDESIRED_EVENT, data: {event: "FXA_METRICS_ERROR"}}));
      }
    }
  }

  componentDidMount() {
    // We need to remove hide-main since we should show it underneath everything that has rendered
    global.document.body.classList.remove("hide-main");

    // Add inline-onboarding class to disable fixed search header and fixed positioned settings icon
    global.document.body.classList.add("inline-onboarding");
  }

  componentDidUnmount() {
    global.document.body.classList.remove("inline-onboarding");
  }

  onInputChange(e) {
    let error = e.target.previousSibling;
    this.setState({emailInput: e.target.value});
    error.classList.remove("active");
    e.target.classList.remove("invalid");
  }

  onSubmit() {
    this.props.dispatch(ac.UserEvent({event: "SUBMIT_EMAIL", ...this._getFormInfo()}));

    global.addEventListener("visibilitychange", this.closeModal);
  }

  closeModal() {
    global.removeEventListener("visibilitychange", this.closeModal);
    global.document.body.classList.remove("welcome");
    this.setState({isModalOpen: false});
    this.props.dispatch(ac.UserEvent({event: "SKIPPED_SIGNIN", ...this._getFormInfo()}));
  }

  /**
   * Report to telemetry additional information about the form submission.
   */
  _getFormInfo() {
    const value = {has_flow_params: this.state.flowId.length > 0};
    return {value};
  }

  onInputInvalid(e) {
    let error = e.target.previousSibling;
    error.classList.add("active");
    e.target.classList.add("invalid");
    e.preventDefault(); // Override built-in form validation popup
    e.target.focus();
  }

  render() {
    const {props} = this;
    const {bundle: cards} = props.message;
    return (<>
    <ModalOverlayWrapper innerClassName="trailhead" active={this.state.isModalOpen}>
      <div className="trailheadInner">
        <div className="trailheadContent">
          <h1 data-l10n-id="onboarding-welcome-body" />
          <ul className="trailheadBenefits">
            {["products", "knowledge", "privacy"].map(id => (
              <li key={id} className={id}>
                <h3 data-l10n-id={`onboarding-benefit-${id}-title`} />
                <p data-l10n-id={`onboarding-benefit-${id}-text`} />
              </li>
            ))}
          </ul>
          <a className="trailheadLearn"
            data-l10n-id="onboarding-welcome-learn-more"
            href="#" />
        </div>
        <div className="trailheadForm">
          <h3 data-l10n-id="onboarding-join-form-header" />
          <p data-l10n-id="onboarding-join-form-body" />
          <form method="get" action={this.props.fxaEndpoint} target="_blank" rel="noopener noreferrer" onSubmit={this.onSubmit}>
            <input name="service" type="hidden" value="sync" />
            <input name="action" type="hidden" value="email" />
            <input name="context" type="hidden" value="fx_desktop_v3" />
            <input name="entrypoint" type="hidden" value="activity-stream-firstrun" />
            <input name="utm_source" type="hidden" value="activity-stream" />
            <input name="utm_campaign" type="hidden" value="firstrun" />
            <input name="utm_term" type="hidden" value="trailhead" />
            <input name="flow_id" type="hidden" value={this.state.flowId} />
            <input name="flow_begin_time" type="hidden" value={this.state.flowBeginTime} />
            <p data-l10n-id="onboarding-join-form-email-error" className="error" />
            <input data-l10n-id="onboarding-join-form-email" name="email" type="email" required="true" onInvalid={this.onInputInvalid} onChange={this.onInputChange} />
            <p className="trailheadTerms" data-l10n-id="onboarding-join-form-legal">
              <a data-l10n-name="terms"
                href="https://accounts.firefox.com/legal/terms" />
              <a data-l10n-name="privacy"
                href="https://accounts.firefox.com/legal/privacy" />
            </p>
            <button data-l10n-id="onboarding-join-form-continue" type="submit" />
          </form>
        </div>
      </div>

      <button className="trailheadStart"
        data-l10n-id="onboarding-start-browsing-button-label"
        onClick={this.closeModal} />
    </ModalOverlayWrapper>
    {(cards && cards.length) ? <div className="trailheadCards">
      <div className="trailheadCardsInner">
        <h1 data-l10n-id="onboarding-welcome-header" />
        <div className="trailheadCardGrid">
        {cards.map(card => (
          <OnboardingCard key={card.id}
            className="trailheadCard"
            sendUserActionTelemetry={props.sendUserActionTelemetry}
            onAction={props.onAction}
            UISurface="TRAILHEAD"
            {...card} />
        ))}
        </div>
      </div>
    </div> : null}
    </>);
  }
}
