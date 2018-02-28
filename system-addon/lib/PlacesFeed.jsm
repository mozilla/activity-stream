/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

const {actionCreators: ac, actionTypes: at} = ChromeUtils.import("resource://activity-stream/common/Actions.jsm", {});

ChromeUtils.defineModuleGetter(this, "NewTabUtils",
  "resource://gre/modules/NewTabUtils.jsm");
ChromeUtils.defineModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");

const LINK_BLOCKED_EVENT = "newtab-linkBlocked";

/**
 * Observer - a wrapper around history/bookmark observers to add the QueryInterface.
 */
class Observer {
  constructor(dispatch, observerInterface) {
    this.dispatch = dispatch;
    this.QueryInterface = XPCOMUtils.generateQI([observerInterface, Ci.nsISupportsWeakReference]);
  }
}

/**
 * HistoryObserver - observes events from PlacesUtils.history
 */
class HistoryObserver extends Observer {
  constructor(dispatch) {
    super(dispatch, Ci.nsINavHistoryObserver);
  }

  /**
   * onDeleteURI - Called when an link is deleted from history.
   *
   * @param  {obj} uri        A URI object representing the link's url
   *         {str} uri.spec   The URI as a string
   */
  async onDeleteURI(uri) {
    // Add to an existing array of links if we haven't dispatched yet
    const {spec} = uri;
    if (this._deletedLinks) {
      this._deletedLinks.push(spec);
    } else {
      // Store an array of synchronously deleted links
      this._deletedLinks = [spec];

      // Only dispatch a single action when we've gotten all deleted urls
      await Promise.resolve().then(() => {
        this.dispatch({
          type: at.PLACES_LINKS_DELETED,
          data: this._deletedLinks
        });
        delete this._deletedLinks;
      });
    }
  }

  /**
   * onClearHistory - Called when the user clears their entire history.
   */
  onClearHistory() {
    this.dispatch({type: at.PLACES_HISTORY_CLEARED});
  }

  // Empty functions to make xpconnect happy
  onBeginUpdateBatch() {}

  onEndUpdateBatch() {}

  onVisits() {}

  onTitleChanged() {}

  onFrecencyChanged() {}

  onManyFrecenciesChanged() {}

  onPageChanged() {}

  onDeleteVisits() {}
}

/**
 * BookmarksObserver - observes events from PlacesUtils.bookmarks
 */
class BookmarksObserver extends Observer {
  constructor(dispatch) {
    super(dispatch, Ci.nsINavBookmarkObserver);
  }

  /**
   * onItemAdded - Called when a bookmark is added
   *
   * @param  {str} id
   * @param  {str} folderId
   * @param  {int} index
   * @param  {int} type       Indicates if the bookmark is an actual bookmark,
   *                          a folder, or a separator.
   * @param  {str} uri
   * @param  {str} title
   * @param  {int} dateAdded
   * @param  {str} guid      The unique id of the bookmark
   * @param  {str} parent guid
   * @param  {int} source    Used to distinguish bookmarks made by different
   *                         actions: sync, bookmarks import, other.
   */
  onItemAdded(id, folderId, index, type, uri, bookmarkTitle, dateAdded, bookmarkGuid, parentGuid, source) { // eslint-disable-line max-params
    // Skips items that are not bookmarks (like folders), about:* pages or
    // default bookmarks, added when the profile is created.
    if (type !== PlacesUtils.bookmarks.TYPE_BOOKMARK ||
        source === PlacesUtils.bookmarks.SOURCES.IMPORT_REPLACE ||
        (uri.scheme !== "http" && uri.scheme !== "https")) {
      return;
    }
    this.dispatch({
      type: at.PLACES_BOOKMARK_ADDED,
      data: {
        bookmarkGuid,
        bookmarkTitle,
        dateAdded,
        url: uri.spec
      }
    });
  }

  /**
   * onItemRemoved - Called when a bookmark is removed
   *
   * @param  {str} id
   * @param  {str} folderId
   * @param  {int} index
   * @param  {int} type       Indicates if the bookmark is an actual bookmark,
   *                          a folder, or a separator.
   * @param  {str} uri
   * @param  {str} guid      The unique id of the bookmark
   */
  onItemRemoved(id, folderId, index, type, uri, guid) {
    if (type === PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      this.dispatch({
        type: at.PLACES_BOOKMARK_REMOVED,
        data: {url: uri.spec, bookmarkGuid: guid}
      });
    }
  }

  /**
   * onItemChanged - Called when a bookmark is modified
   *
   * @param  {str} id           description
   * @param  {str} property     The property that was modified (e.g. uri, title)
   * @param  {bool} isAnnotation
   * @param  {any} value
   * @param  {int} lastModified
   * @param  {int} type         Indicates if the bookmark is an actual bookmark,
   *                             a folder, or a separator.
   * @param  {int} parent
   * @param  {str} guid         The unique id of the bookmark
   */
  async onItemChanged(...args) {

    /*
    // Disabled due to performance cost, see Issue 3203 /
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1392267.
    //
    // If this is used, please consider avoiding the call to
    // NewTabUtils.activityStreamProvider.getBookmark which performs an additional
    // fetch to the database.
    // If you need more fields, please talk to the places team.

    const property = args[1];
    const type = args[5];
    const guid = args[7];

    // Only process this event if it is a TYPE_BOOKMARK, and uri or title was the property changed.
    if (type !== PlacesUtils.bookmarks.TYPE_BOOKMARK || !["uri", "title"].includes(property)) {
      return;
    }
    try {
      // bookmark: {bookmarkGuid, bookmarkTitle, lastModified, url}
      const bookmark = await NewTabUtils.activityStreamProvider.getBookmark(guid);
      this.dispatch({type: at.PLACES_BOOKMARK_CHANGED, data: bookmark});
    } catch (e) {
      Cu.reportError(e);
    }
    */
  }

  // Empty functions to make xpconnect happy
  onBeginUpdateBatch() {}

  onEndUpdateBatch() {}

  onItemVisited() {}

  onItemMoved() {}
}

class PlacesFeed {
  constructor() {
    this.historyObserver = new HistoryObserver(action => this.store.dispatch(ac.BroadcastToContent(action)));
    this.bookmarksObserver = new BookmarksObserver(action => this.store.dispatch(ac.BroadcastToContent(action)));
  }

  addObservers() {
    // NB: Directly get services without importing the *BIG* PlacesUtils module
    Cc["@mozilla.org/browser/nav-history-service;1"]
      .getService(Ci.nsINavHistoryService)
      .addObserver(this.historyObserver, true);
    Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
      .getService(Ci.nsINavBookmarksService)
      .addObserver(this.bookmarksObserver, true);

    Services.obs.addObserver(this, LINK_BLOCKED_EVENT);
  }

  removeObservers() {
    PlacesUtils.history.removeObserver(this.historyObserver);
    PlacesUtils.bookmarks.removeObserver(this.bookmarksObserver);
    Services.obs.removeObserver(this, LINK_BLOCKED_EVENT);
  }

  /**
   * observe - An observer for the LINK_BLOCKED_EVENT.
   *           Called when a link is blocked.
   *
   * @param  {null} subject
   * @param  {str} topic   The name of the event
   * @param  {str} value   The data associated with the event
   */
  observe(subject, topic, value) {
    if (topic === LINK_BLOCKED_EVENT) {
      this.store.dispatch(ac.BroadcastToContent({
        type: at.PLACES_LINK_BLOCKED,
        data: {url: value}
      }));
    }
  }

  /**
   * Open a link in a desired destination defaulting to action's event.
   */
  openLink(action, where = "", isPrivate = false) {
    const params = {
      private: isPrivate,
      triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
    };

    // Always include the referrer (even for http links) if we have one
    const {event, referrer} = action.data;
    if (referrer) {
      params.referrerPolicy = Ci.nsIHttpChannel.REFERRER_POLICY_UNSAFE_URL;
      params.referrerURI = Services.io.newURI(referrer);
    }

    const win = action._target.browser.ownerGlobal;
    win.openLinkIn(action.data.url, where || win.whereToOpenLink(event), params);
  }

  async saveToPocket(site, browser) {
    const {url, title} = site;
    try {
      let data = await NewTabUtils.activityStreamLinks.addPocketEntry(url, title, browser);
      if (data) {
        this.store.dispatch(ac.BroadcastToContent({
          type: at.PLACES_SAVED_TO_POCKET,
          data: {url, title, pocket_id: data.item.item_id}
        }));
      }
    } catch (err) {
      Cu.reportError(err);
    }
  }

  onAction(action) {
    switch (action.type) {
      case at.INIT:
        // Briefly avoid loading services for observing for better startup timing
        Services.tm.dispatchToMainThread(() => this.addObservers());
        break;
      case at.UNINIT:
        this.removeObservers();
        break;
      case at.BLOCK_URL: {
        const {url, pocket_id} = action.data;
        NewTabUtils.activityStreamLinks.blockURL({url, pocket_id});
        break;
      }
      case at.BOOKMARK_URL:
        NewTabUtils.activityStreamLinks.addBookmark(action.data, action._target.browser);
        break;
      case at.DELETE_BOOKMARK_BY_ID:
        NewTabUtils.activityStreamLinks.deleteBookmark(action.data);
        break;
      case at.DELETE_HISTORY_URL: {
        const {url, forceBlock, pocket_id} = action.data;
        NewTabUtils.activityStreamLinks.deleteHistoryEntry(url);
        if (forceBlock) {
          NewTabUtils.activityStreamLinks.blockURL({url, pocket_id});
        }
        break;
      }
      case at.OPEN_NEW_WINDOW:
        this.openLink(action, "window");
        break;
      case at.OPEN_PRIVATE_WINDOW:
        this.openLink(action, "window", true);
        break;
      case at.SAVE_TO_POCKET:
        this.saveToPocket(action.data.site, action._target.browser);
        break;
      case at.OPEN_LINK: {
        this.openLink(action);
        break;
      }
    }
  }
}

this.PlacesFeed = PlacesFeed;

// Exported for testing only
PlacesFeed.HistoryObserver = HistoryObserver;
PlacesFeed.BookmarksObserver = BookmarksObserver;

const EXPORTED_SYMBOLS = ["PlacesFeed"];
