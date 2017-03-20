/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals AboutNewTab, RemotePages, XPCOMUtils */

"use strict";

const {utils: Cu} = Components;

Cu.import("resource://gre/modules/RemotePageManager.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const {
  actionUtils: au,
  actionCreators: ac,
  actionTypes: at
} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

XPCOMUtils.defineLazyModuleGetter(this, "AboutNewTab",
  "resource:///modules/AboutNewTab.jsm");

const ABOUT_NEW_TAB_URL = "about:newtab";

const DEFAULT_OPTIONS = {
  dispatch(action) { dump(`\nMessage manager: Received action ${action.type}, but no dispatcher was defined.\n`); },
  pageURL: ABOUT_NEW_TAB_URL,
  outgoingMessageName: "ActivityStream:MainToContent",
  incomingMessageName: "ActivityStream:ContentToMain"
};

class MessageManager {
  constructor(options = {}) {
    Object.assign(this, DEFAULT_OPTIONS, options);
    this.channel = null;

    this.middleware = this.middleware.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onNewTabLoad = this.onNewTabLoad.bind(this);
    this.onNewTabUnload = this.onNewTabUnload.bind(this);
  }

  middleware(store) {
    return next => action => {
      if (!this.channel) {
        next(action);
        return;
      }
      if (au.isSendToContent(action)) {
        this.send(action);
      } else if (au.isBroadcastToContent(action)) {
        this.broadcast(action);
      }
      next(action);
    };
  }

  onActionFromContent(action, targetId) {
    this.dispatch(ac.SendToMain(action, {fromTarget: targetId}));
  }

  broadcast(action) {
    this.channel.sendAsyncMessage(this.outgoingMessageName, action);
  }

  send(action) {
    const targetId = action.meta && action.meta.toTarget;
    const target = this.getTargetById(targetId);
    if (!target) {
      Cu.reportError(new Error(`Tried to send a message to a target (${targetId}) that was no longer around.`));
      return;
    }
    target.sendAsyncMessage(this.outgoingMessageName, action);
  }

  /**
   * getIdByTarget - Retrieve the id of a message target, if it exists in this.targets
   *
   * @param  {obj} targetObj A message target
   * @return {string|null} The unique id of the target, if it exists.
   */
  getTargetById(id) {
    for (let port of this.channel.messagePorts) {
      if (port.portID === id) {
        return port;
      }
    }
    return null;
  }

  /**
   * createChannel - Create RemotePages channel to establishing message passing
   *                 between the main process and child pages
   */
  createChannel() {
    //  RemotePageManager must be disabled for about:newtab, since only one can exist at once
    if (this.pageURL === ABOUT_NEW_TAB_URL) {
      AboutNewTab.override();
    }
    this.channel = new RemotePages(this.pageURL);
    this.channel.addMessageListener("RemotePage:Load", this.onNewTabLoad);
    this.channel.addMessageListener("RemotePage:Unload", this.onNewTabUnload);
    this.channel.addMessageListener(this.incomingMessageName, this.onMessage);
  }

  /**
   * destroyChannel - Destroys the RemotePages channel
   *
   * @return {type}  description
   */
  destroyChannel() {
    this.channel.destroy();
    this.channel = null;
    if (this.pageURL === ABOUT_NEW_TAB_URL) {
      AboutNewTab.reset();
    }
  }

  /**
   * onNewTabLoad - Handler for special RemotePage:Load message fired by RemotePages
   *
   * @param  {obj} msg The messsage from a page that was just loaded
   */
  onNewTabLoad(msg) {
    this.onActionFromContent({type: at.NEW_TAB_LOAD}, msg.target.portID);
  }

  /**
   * onNewTabUnloadLoad - Handler for special RemotePage:Unload message fired by RemotePages
   *
   * @param  {obj} msg The messsage from a page that was just unloaded
   */
  onNewTabUnload(msg) {
    this.onActionFromContent({type: at.NEW_TAB_UNLOAD}, msg.target.portID);
  }

  /**
   * onMessage - Handles custom messages from content. It expects all messages to
   *             be formatted as Redux actions, and dispatches them to this.store
   *
   * @param  {obj} msg A custom message from content
   * @param  {obj} msg.action A Redux action (e.g. {type: "HELLO_WORLD"})
   * @param  {obj} msg.target A message target
   */
  onMessage(msg) {
    const action = msg.data;
    const {portID} = msg.target;
    if (!action || !action.type) {
      Cu.reportError(new Error(`Received an improperly formatted message from ${portID}`));
      return;
    }
    this.onActionFromContent(action, msg.target.portID);
  }
}

this.MessageManager = MessageManager;
this.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
this.EXPORTED_SYMBOLS = ["MessageManager", "DEFAULT_OPTIONS"];
