/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

Cu.importGlobalProperties(["fetch", "URL"]);

const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});
const {PersistentCache} = Cu.import("resource://activity-stream/lib/PersistentCache.jsm", {});
const {Prefs} = Cu.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {getDomain} = Cu.import("resource://activity-stream/lib/TippyTopProvider.jsm", {});

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

const TIPPYTOP_UPDATE_TIME = 24 * 60 * 60 * 1000; // 24 hours

this.FaviconFeed = class FaviconFeed {
  constructor() {
    this.tippyTopLastUpdated = 0;
    this.cache = new PersistentCache("tippytop", true);
    this.prefs = new Prefs();
    this._sitesByDomain = null;
  }

  async loadCachedData() {
    const data = await this.cache.get("sites");
    if (data && data._timestamp) {
      this._sitesByDomain = data;
      this.tippyTopLastUpdated = data._timestamp;
    }
  }

  async maybeRefresh() {
    if (Date.now() - this.tippyTopLastUpdated >= TIPPYTOP_UPDATE_TIME) {
      await this.refresh();
    }
  }

  async refresh() {
    let headers = new Headers();
    if (this._sitesByDomain && this._sitesByDomain._etag) {
      headers.set("If-None-Match", this._sitesByDomain._etag);
    }
    let {data, etag, status} = await this.loadFromURL(this.prefs.get("tippyTop.service.endpoint"), headers);
    if (status === 304) {
      // Not modified, we are done. No need to dispatch actions or update cache. We'll check again in 24+ hours.
      this.tippyTopLastUpdated = Date.now();
      return;
    }
    if (status === 200 && data) {
      let sitesByDomain = this._sitesArrayToObjectByDomain(data);
      sitesByDomain._etag = etag;
      this.tippyTopLastUpdated = sitesByDomain._timestamp = Date.now();
      this.cache.set("sites", sitesByDomain);
      this._sitesByDomain = sitesByDomain;
    }
  }

  async loadFromURL(url, headers) {
    let data = [];
    let etag;
    let status;
    try {
      let response = await fetch(url, {headers});
      status = response.status;
      if (status === 200) {
        data = await response.json();
        etag = response.headers.get("ETag");
      }
    } catch (error) {
      Cu.reportError(`Failed to load tippy top manifest from ${url}`);
    }
    return {data, etag, status};
  }

  _sitesArrayToObjectByDomain(sites) {
    let sitesByDomain = {};
    for (const site of sites) {
      // The tippy top manifest can have a url property (string) or a
      // urls property (array of strings)
      for (const url of site.url ? [site.url] : site.urls || []) {
        sitesByDomain[getDomain(url)] = site;
      }
    }
    return sitesByDomain;
  }

  getSitesByDomain() {
    // return an already loaded object or a promise for that object
    return this._sitesByDomain || (this._sitesByDomain = new Promise(async resolve => {
      await this.loadCachedData();
      await this.maybeRefresh();
      resolve(this._sitesByDomain);
    }));
  }

  async fetchIcon(url) {
    const sitesByDomain = await this.getSitesByDomain();
    const domain = getDomain(url);
    if (domain in sitesByDomain) {
      let iconUri = Services.io.newURI(sitesByDomain[domain].image_url);
      // The #tippytop is to be able to identify them for telemetry.
      iconUri.ref = "tippytop";
      PlacesUtils.favicons.setAndFetchFaviconForPage(
        Services.io.newURI(url),
        iconUri,
        false,
        PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE,
        null,
        Services.scriptSecurityManager.getSystemPrincipal()
      );
    }
  }

  onAction(action) {
    switch (action.type) {
      case at.SYSTEM_TICK:
        if (this._sitesByDomain) {
          // No need to refresh if we haven't been initialized.
          this.maybeRefresh();
        }
        break;
      case at.RICH_ICON_MISSING:
        this.fetchIcon(action.data.url);
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["FaviconFeed"];
