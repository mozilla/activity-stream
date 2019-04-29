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
    // XXX temporary icons
    const icon = {
      productive: "topsites",
      smarter: "pocket",
      privacy: "highlights",
    };

    const {props} = this;
    const {cards} = props.message.content;
    return (<>
    <ModalOverlayWrapper innerClassName="trailhead" active={this.state.isModalOpen}>
      <div className="trailheadInner">
        <div className="trailheadContent">
          <h1 data-l10n-id="onboarding-welcome-body" />
          <ul className="trailheadBenefits">
            {["productive", "smarter", "privacy"].map(id => (
              <li key={id} style={{
                backgroundImage: `url(resource://activity-stream/data/content/assets/glyph-${icon[id]}-16.svg)`,
              }}>
                <h3 data-l10n-id={`onboarding-benefit-${id}-title`} />
                <p data-l10n-id={`onboarding-benefit-${id}-text`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="trailheadForm">
          <img src="chrome://branding/content/icon64.png" />
          <h3 data-l10n-id="onboarding-join-form-header" />
          <p data-l10n-id="onboarding-join-form-body">
            <a data-l10n-name="benefits"
              href="#" />
          </p>
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
    <h1 data-l10n-id="onboarding-welcome-header" />
    <div className="trailheadCards">
    {cards.map(card => (
      <OnboardingCard key={card.id}
        sendUserActionTelemetry={props.sendUserActionTelemetry}
        onAction={props.onAction}
        UISurface="TRAILHEAD"
        {...card} />
    ))}
    </div>
    </>);
  }
}
