/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

/**
 * NewTabInit - A placeholder for now. This will send a copy of the state to all
 *              newly opened tabs.
 */
this.NewTabInit = class NewTabInit {
  onAction(action) {
    switch (action.type) {
      // TODO: Replace with sending a copy of the state when a NEW_TAB_LOAD action is received
      case at.INIT:
        dump(`\n${JSON.stringify(this.store.getState(), 0, 2)}\n`);
    }
  }
};

this.EXPORTED_SYMBOLS = ["NewTabInit"];
