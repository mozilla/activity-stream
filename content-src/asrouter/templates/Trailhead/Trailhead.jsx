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
  componentWillMount() {
    FLUENT_FILES.forEach(file => {
      const link = document.head.appendChild(document.createElement("link"));
      link.href = file;
      link.rel = "localization";
    });
  }

  render() {
    const {props} = this;
    const {content} = props.message;

    return (<div className="overlay-wrapper show trailhead">
      <div className="trailheadInner">
        <div className="trailheadContent">
          <h3 data-l10n-id="onboarding-welcome-header" />
          <p data-l10n-id="onboarding-welcome-body" />
        </div>
        <div className="trailheadCards">
          <div className="onboardingMessageContainer">
          {content.cards.map(card => (
            <OnboardingCard key={card.id}
              sendUserActionTelemetry={props.sendUserActionTelemetry}
              onAction={props.onAction}
              UISurface="TRAILHEAD"
              {...card} />
          ))}
          </div>
        </div>
        <div className="trailheadContent">
          <h2 data-l10n-id="onboarding-membership-form-header" />
          <input type="email" data-l10n-id="onboarding-membership-form-email" />
          <p data-l10n-id="onboarding-membership-form-legal-links">
            <a data-l10n-name="terms"
              href="https://accounts.firefox.com/legal/terms" />
            <a data-l10n-name="privacy"
              href="https://accounts.firefox.com/legal/privacy" />
          </p>
          <button data-l10n-id="onboarding-membership-form-continue" />
        </div>
        <button data-l10n-id="onboarding-start-browsing-button-label" />
      </div>

    </div>);
  }
}
