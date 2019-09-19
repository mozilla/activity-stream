/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac } from "common/Actions.jsm";
import React from "react";
import { SafeAnchor } from "../SafeAnchor/SafeAnchor";
import { ModalOverlayWrapper } from "content-src/asrouter/components/ModalOverlay/ModalOverlay";

export class DSPrivacyModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
  }

  closeModal() {
    console.log(`closeModal()`);

    this.props.dispatch({
      type:`HIDE_PRIVACY_INFO`,
      data: {},
    });
  }

  render() {
    return (
      <ModalOverlayWrapper
        onClose={this.closeModal}
      >
        <h3 data-l10n-id="newtab-privacy-modal-header"></h3>
        <p data-l10n-id="newtab-privacy-modal-paragraph"></p>
        <a data-l10n-id="newtab-privacy-modal-link" href="#TODO"></a>
        <section className="actions">
          <button
            className="done"
            type="submit"
            onClick={this.closeModal}
            data-l10n-id="newtab-privacy-modal-done"
          />
        </section>
      </ModalOverlayWrapper>
    );
  }
}
