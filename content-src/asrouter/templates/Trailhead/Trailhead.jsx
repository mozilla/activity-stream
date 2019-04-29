import {ModalOverlayWrapper} from "../../components/ModalOverlay/ModalOverlay";
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
    this.setState({isModalOpen: false});
  }

  render() {
    return (<ModalOverlayWrapper innerClassName="trailheadInner" active={this.state.isModalOpen}>
      <div className="trailheadContent">
        <h3 data-l10n-id="onboarding-welcome-header" />
        <p data-l10n-id="onboarding-welcome-body" />
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
      <button onClick={this.closeModal} data-l10n-id="onboarding-start-browsing-button-label" />
    </ModalOverlayWrapper>);
  }
}
