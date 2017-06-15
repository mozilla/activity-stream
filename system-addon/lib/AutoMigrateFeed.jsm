/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const {actionTypes: at, actionCreators: ac} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

XPCOMUtils.defineLazyModuleGetter(this, "AutoMigrate",
  "resource:///modules/AutoMigrate.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "MigrationUtils",
  "resource:///modules/MigrationUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

this.AutoMigrateFeed = class AutoMigrateFeed {
  onAction(action) {
    switch (action.type) {
      case at.AUTOMIGRATE_MANUAL_IMPORT:
        // We pass in the type of source we're using for use in telemetry
        MigrationUtils.showMigrationWizard(action._target.browser.ownerGlobal,
          [MigrationUtils.MIGRATION_ENTRYPOINT_NEWTAB]);
        break;
      case at.AUTOMIGRATE_MIGRATE_DONE:
        AutoMigrate.keepAutoMigration();
        this.store.dispatch(ac.BroadcastToContent({type: at.AUTOMIGRATE_HIDE}));
        break;
      case at.AUTOMIGRATE_UNDO_MIGRATION:
        AutoMigrate.undoAutoMigration(action._target.browser.ownerGlobal);
        this.store.dispatch(ac.BroadcastToContent({type: at.AUTOMIGRATE_IS_REVERTED}));
        break;
      case at.NEW_TAB_VISIBLE:
        AutoMigrate.shouldShowMigratePrompt(action._target.browser).then(prompt => {
          if (prompt) {
            let browserName = Services.prefs.getStringPref("browser.migrate.automigrate.browser", "");
            if (browserName === "") {
              this.store.dispatch(ac.BroadcastToContent({type: at.AUTOMIGRATE_IS_REVERTED}));
            } else {
              let msg = AutoMigrate.getUndoMigrationMessage();
              this.store.dispatch(ac.BroadcastToContent({
                type: at.AUTOMIGRATE_MIGRATED,
                data: {msg}
              }));
            }
          } else if (this.store.getState().AutoMigrate.display) {
            this.store.dispatch(ac.BroadcastToContent({type: at.AUTOMIGRATE_HIDE}));
          }
        }).catch(Cu.reportError);
        break;
      default:
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["AutoMigrateFeed"];
