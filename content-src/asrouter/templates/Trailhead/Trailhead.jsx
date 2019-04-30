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
    this.state = {isModalOpen: true};
    this.closeModal = this.closeModal.bind(this);
  }

  componentWillMount() {
    FLUENT_FILES.forEach(file => {
      const link = document.head.appendChild(document.createElement("link"));
      link.href = file;
      link.rel = "localization";
    });
  }

  componentDidMount() {
    // We need to remove hide-main since we should show it underneath everything that has rendered
    global.document.body.classList.remove("hide-main");
  }

  closeModal() {
    global.document.body.classList.remove("welcome");
    this.setState({isModalOpen: false});
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
          <input type="email" data-l10n-id="onboarding-join-form-email" />
          <p data-l10n-id="onboarding-join-form-email-error" />
          <p data-l10n-id="onboarding-join-form-legal">
            <a data-l10n-name="terms"
              href="https://accounts.firefox.com/legal/terms" />
            <a data-l10n-name="privacy"
              href="https://accounts.firefox.com/legal/privacy" />
          </p>
          <button data-l10n-id="onboarding-join-form-continue" />
        </div>
      </div>

      <button className="trailheadStart"
        data-l10n-id="onboarding-start-browsing-button-label"
        onClick={this.closeModal} />
    </ModalOverlayWrapper>
    {(cards && cards.length) ? <div className="trailheadCards">
      <div className="trailheadCardsInner">
        <h1 data-l10n-id="onboarding-welcome-header" />
        <div className="onboardingMessageContainer">
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
