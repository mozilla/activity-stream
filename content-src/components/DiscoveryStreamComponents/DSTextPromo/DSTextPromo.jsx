/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import { SafeAnchor } from "../SafeAnchor/SafeAnchor";

export class DSTextPromo extends React.PureComponent {
  render() {
    // Grab the first item in the array as we only have 1 spoc position.
    if (
      !this.props.data ||
      !this.props.data.spocs ||
      !this.props.data.spocs[0]
    ) {
      return null;
    }
    const [
      { image_src, alt_text, title, url, context, cta },
    ] = this.props.data.spocs;
    return (
      <div className="ds-text-promo">
        <img src={image_src} alt={alt_text || title} />
        <div className="text">
          <h3>
            {`${title}\u2003`}
            <SafeAnchor className="ds-chevron-link" url={url}>
              {cta}
            </SafeAnchor>
          </h3>
          <p className="subtitle">{context}</p>
        </div>
      </div>
    );
  }
}
