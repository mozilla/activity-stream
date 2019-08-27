/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac } from "common/Actions.jsm";
import React from "react";
import { LinkMenuOptions } from "content-src/lib/link-menu-options";

export class DSDismiss extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onDismissClick = this.onDismissClick.bind(this);
  }

  onDismissClick() {
    const index = 0;
    const source = "DISCOVERY_STREAM";
    const blockUrlOption = LinkMenuOptions.BlockUrl(
      this.props.data,
      index,
      source
    );

    const { action, impression, userEvent } = blockUrlOption;

    this.props.dispatch(action);
    if (userEvent) {
      const userEventData = Object.assign(
        {
          event: userEvent,
          source,
          action_position: index,
        },
        this.props.data
      );
      this.props.dispatch(ac.UserEvent(userEventData));
    }
    if (impression && this.props.shouldSendImpressionStats) {
      this.props.dispatch(impression);
    }
  }

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
        <button onClick={this.onDismissClick}>dismiss</button>
      </div>
    );
  }
}
