/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const {actionTypes: at, actionCreators: ac} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

Cu.import("resource://gre/modules/Log.jsm");
let console = Log.repository.getLogger("AutoMigrate");
console.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

XPCOMUtils.defineLazyModuleGetter(this, "AutoMigrate",
  "resource:///modules/AutoMigrate.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

this.AutoMigrateFeed = class NewTabInit {
  onAction(action) {
    switch (action.type) {
      case at.NEW_TAB_VISIBLE:
        AutoMigrate.shouldShowMigratePrompt(action._target.browser).then(prompt => {
          if (prompt) {
            let browserName = Services.prefs.getStringPref("browser.migrate.automigrate.browser", "");
            if (browserName === "") {
              console.debug(">> stage 1");
              this.store.dispatch(ac.BroadcastToContent({type: at.AUTOMIGRATE_IS_REVERTED}));
            } else {
              console.debug(">> stage 0");
              let msg = AutoMigrate.getUndoMigrationMessage();
              this.store.dispatch(ac.BroadcastToContent({
                type: at.AUTOMIGRATE_AUTOMIGRATED,
                data: {msg}
              }));
            }
          } else {
            console.debug(">> not show");
          }
        }).catch(() => {});
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["AutoMigrateFeed"];
