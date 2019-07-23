/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";

export class DSDismiss extends React.PureComponent {
  render() {
    // TODO:
    // This needs an x button that dismisses the campaign_id passed to it.
    // It also needs a hover state for it and its children.
    // Somewhere else, we need to filter out anything with a campaign_id that we've blocked.
    // Consider calling this collection_id.
    // Right now it is this.props.campaignId
    return (
      <div className="ds-dismiss">
        {this.props.children}
      </div>
    );
  }
}
