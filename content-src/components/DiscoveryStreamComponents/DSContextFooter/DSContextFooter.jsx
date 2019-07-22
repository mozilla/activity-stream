/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cardContextTypes } from "../../Card/types.js";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import React from "react";

const StatusMessage = ({ icon, fluentID }) => (
  <div className="status-message">
    <span
      aria-haspopup="true"
      className={`story-badge-icon icon icon-${icon}`}
    />
    <div className="story-context-label" data-l10n-id={fluentID} />
  </div>
);

export class DSContextFooter extends React.PureComponent {
  render() {
    const { context, context_type } = this.props;
    const { icon, fluentID } = cardContextTypes[context_type] || {};

    return (
      <div className="story-footer">
        {context && <p className="story-sponsored-label">{context}</p>}
        <TransitionGroup component={null}>
          {!context && context_type && (
            <CSSTransition
              key={fluentID}
              timeout={3000}
              classNames="story-animate"
            >
              <StatusMessage icon={icon} fluentID={fluentID} />
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    );
  }
}
