/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import { SafeAnchor } from "../SafeAnchor/SafeAnchor";

export class DSTextPromo extends React.PureComponent {
  render() {
    return (
      <div className="ds-text-promo">
        <img src={this.props.image} alt={this.props.alt_text} />
        <div class="text">
          <header>
            {`${this.props.header}\u2003`}
            <SafeAnchor className="ds-chevron-link" url={this.props.cta_url}>
              {this.props.cta_text}
            </SafeAnchor>
          </header>
          <p class="subtitle">{this.props.subtitle}</p>
        </div>
      </div>
    );
  }
}
