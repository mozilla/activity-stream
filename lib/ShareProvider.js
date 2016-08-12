/* globals require, exports, XPCOMUtils, CustomizableUI, Services, Social, Task */

const {Cc, Ci, Cu} = require("chrome");
const {data} = require("sdk/self");
const DEFAULT_MANIFEST_PREFS = require("lib/ShareManifests");

const clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
const SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://services-common/utils.js");
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Task.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "CustomizableUI",
                                  "resource:///modules/CustomizableUI.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Social",
                                  "resource:///modules/Social.jsm");

// based on SocialShare.sharePage in browser-social.js
// target would be item clicked on for a context menu, but not handled in this case
function windowProperty(window, eventTracker) {
  return {
    configurable: true,
    enumerable: true,
    writable: true,
    value: {
      copyLink: url => {
        clipboard.copyString(url);
        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: "copy-link"
        });
      },
      emailLink: (browser, url) => {
        window.MailIntegration.sendLinkForBrowser(browser);
        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: "email-link"
        });
      },
      sharePage: (providerOrigin, graphData, target) => {
        const {
          SocialUI,
          Social,
          messageManager,
          gBrowser,
          OpenGraphBuilder,
          ShareUtils
        } = window;

        // graphData is an optional param that either defines the full set of data
        // to be shared, or partial data about the current page. It is set by a call
        // in mozSocial API, or via nsContentMenu calls. If it is present, it MUST
        // define at least url. If it is undefined, we're sharing the current url in
        // the browser tab.
        let pageData = graphData ? graphData : null;
        let sharedURI = pageData ? Services.io.newURI(pageData.url, null, null) :
                                    gBrowser.currentURI;
        if (!SocialUI.canShareOrMarkPage(sharedURI)) {
          return;
        }

        // the point of this action type is that we can use existing share
        // endpoints (e.g. oexchange) that do not support additional
        // socialapi functionality.  One tweak is that we shoot an event
        // containing the open graph data.
        let _dataFn;
        if (!pageData || sharedURI === gBrowser.currentURI) {
          messageManager.addMessageListener("PageMetadata:PageDataResult", _dataFn = msg => {
            messageManager.removeMessageListener("PageMetadata:PageDataResult", _dataFn);
            let pageData = msg.json;
            if (graphData) {
              // overwrite data retreived from page with data given to us as a param
              for (let p of Object.keys(graphData)) {
                pageData[p] = graphData[p];
              }
            }
            ShareUtils.sharePage(providerOrigin, pageData, target);
          });
          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("PageMetadata:GetPageData", null, {target});
          return;
        }
        // if this is a share of a selected item, get any microformats
        if (!pageData.microformats && target) {
          messageManager.addMessageListener("PageMetadata:MicroformatsResult", _dataFn = msg => {
            messageManager.removeMessageListener("PageMetadata:MicroformatsResult", _dataFn);
            pageData.microformats = msg.data;
            ShareUtils.sharePage(providerOrigin, pageData, target);
          });
          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("PageMetadata:GetMicroformats", null, {target});
          return;
        }

        let provider = Social._getProviderFromOrigin(providerOrigin);
        if (!provider || !provider.shareURL) {
          return;
        }

        let shareEndpoint = OpenGraphBuilder.generateEndpointURL(provider.shareURL, pageData);
        window.open(shareEndpoint, "share-dialog", "chrome");

        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: provider.origin
        });
      }
    }
  };
}

// This is to register a ShareUtils object in the browser chrome window and
// to hide the existing social share (paper airplane) button.
const Overlay = {
  init: eventTracker => {
    for (let win of CustomizableUI.windows) {
      Overlay.setWindowScripts(win, eventTracker);
    }
    Services.obs.addObserver(Overlay, "browser-delayed-startup-finished", false);
  },
  uninit: () => {
    Services.obs.removeObserver(Overlay, "browser-delayed-startup-finished");
    for (let win of CustomizableUI.windows) {
      delete win.ShareUtils;
      if (win.SocialShare.shareButton) {
        win.SocialShare.shareButton.removeAttribute("hidden");
      }
    }
  },
  observe: window => {
    Overlay.setWindowScripts(window);
  },
  setWindowScripts: (window, eventTracker) => {
    Object.defineProperty(window, "ShareUtils", windowProperty(window, eventTracker));

    if (window.SocialShare.shareButton) {
      window.SocialShare.shareButton.setAttribute("hidden", "true");
    }
  }
};

function createElementWithAttrs(document, type, attrs) {
  let element = document.createElement(type);
  Object.keys(attrs).forEach(attr => {
    element.setAttribute(attr, attrs[attr]);
  });
  return element;
}

const DEFAULT_OPTIONS = {eventTracker: {handleUserEvent() {}}};

function ShareProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this.eventTracker = this.options.eventTracker;
}

ShareProvider.prototype = {

  /**
   * Initialize Share Provider
   */
  init: Task.async(function*() {
    yield this._setupProviders();
    this._createButton();
    Overlay.init(this.eventTracker);
  }),

  /**
   * Set up the prefs and enable a default set of social providers if the user
   * hasn't enabled any.
   */
  _setupProviders: Task.async(function*() {
    if (!Services.prefs.prefHasUserValue("social.activeProviders")) {
      let promises = [];
      for (let key of Object.keys(DEFAULT_MANIFEST_PREFS)) {
        this._setPref(key, DEFAULT_MANIFEST_PREFS[key]);
        promises.push(new Promise(resolve => {
          SocialService.enableProvider(DEFAULT_MANIFEST_PREFS[key].origin, resolve);
        }));
      }
      Services.prefs.setBoolPref("social.enabledByActivityStream", true);
      yield Promise.all(promises);
    }
  }),

  _setPref(key, value) {
    let string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
    string.data = JSON.stringify(value);
    Services.prefs.setComplexValue(key, Ci.nsISupportsString, string);
  },

  _unsetupProviders: Task.async(function*() {
    if (Services.prefs.getBoolPref("social.enabledByActivityStream")) {
      let promises = [];
      for (let key of Object.keys(DEFAULT_MANIFEST_PREFS)) {
        let _key = key;
        promises.push(new Promise(resolve => {
          SocialService.uninstallProvider(DEFAULT_MANIFEST_PREFS[_key].origin, () => {
            Services.prefs.clearUserPref(_key);
            resolve();
          });
        }));
      }
      yield Promise.all(promises);
      Services.prefs.clearUserPref("social.activeProviders");
      Services.prefs.clearUserPref("social.enabledByActivityStream");
    }
  }),

  /**
   * Create the share button widget
   */
  _createButton() {
    let id = "activity-stream-share-button";
    let widget = CustomizableUI.getWidget(id);

    // The widget is only null if we've created then destroyed the widget.
    // Once we've actually called createWidget the provider will be set to
    // PROVIDER_API.
    if (widget && widget.provider === CustomizableUI.PROVIDER_API) {
      return;
    }

    let shareButton = {
      id,
      defaultArea: CustomizableUI.AREA_NAVBAR,
      introducedInVersion: "pref",
      type: "view",
      viewId: "PanelUI-shareMenuView",
      label: "Share",
      tooltiptext: "Share",
      onViewShowing: () => {},
      onViewHiding: () => {},
      onBeforeCreated: doc => {
        if (doc.getElementById("PanelUI-shareMenuView")) {
          return;
        }
        let view = doc.createElement("panelview");
        view.id = "PanelUI-shareMenuView";
        doc.getElementById("PanelUI-multiView").appendChild(view);
        shareButton.populateProviderMenu(doc);
      },
      populateProviderMenu: doc => {
        let view = doc.getElementById("PanelUI-shareMenuView");
        for (let el of [...view.childNodes]) {
          el.remove();
        }

        let item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Copy Address",
          "image": data.url("content/img/glyph-copy-16.svg"),
          "oncommand": "ShareUtils.copyLink(gBrowser.currentURI.spec);"
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Email Link...",
          "image": data.url("content/img/glyph-email-16.svg"),
          "oncommand": "ShareUtils.emailLink(gBrowser.selectedBrowser, gBrowser.currentURI.spec);"
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "menuseparator", {"id": "menu_shareMenuSeparator"});
        view.appendChild(item);

        const defaultSort = ["Facebook", "Twitter", "Tumblr", "LinkedIn", "Yahoo Mail", "Gmail"];
        let providers = Social.providers.filter(p => p.shareURL);
        for (let provider of providers) {
          let index = defaultSort.indexOf(provider.name);
          if (index < 0) {
            index = 99;
          }
          provider.sortIndex = index;
        }
        providers.sort((a, b) => a.sortIndex - b.sortIndex);

        for (let provider of providers) {
          let item = createElementWithAttrs(doc, "toolbarbutton", {
            "class": "subviewbutton",
            "label": provider.name,
            "image": provider.iconURL,
            "origin": provider.origin,
            "oncommand": `ShareUtils.sharePage("${provider.origin}");`
          });
          view.appendChild(item);
        }

        item = createElementWithAttrs(doc, "menuseparator", {"id": "menu_shareMenuSeparator"});
        view.appendChild(item);

        let url = Services.prefs.getCharPref("social.directories").split(",")[0];
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Add Services",
          "image": data.url("content/img/glyph-add-16.svg"),
          "oncommand": `openUILinkIn("${url}", "tab");`
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Remove Services",
          "image": data.url("content/img/glyph-delete-16.svg"),
          "oncommand": "BrowserOpenAddonsMgr('addons://list/service');"
        });
        view.appendChild(item);
      },
      onCreated: node => {
        // quick hack to add style for share icon
        if (!node || node.id !== id) {
          return;
        }
        node.setAttribute("image", data.url("content/img/glyph-share-16.svg"));
        node.setAttribute("observes", "Social:PageShareOrMark");
      },
      observe: (aSubject, aTopic, aData) => {
        for (let win of CustomizableUI.windows) {
          let document = win.document;
          shareButton.populateProviderMenu(document);
        }
      }
    };

    CustomizableUI.createWidget(shareButton);
    CustomizableUI.addListener(shareButton);
    Services.obs.addObserver(shareButton, "social:providers-changed", false);
  },

  /**
   * Uninit the Share Provider
   */
  uninit: Task.async(function*(reason) {
    CustomizableUI.destroyWidget("activity-stream-share-button");

    Overlay.uninit();

    if (reason === "uninstall" || reason === "disable") {
      yield this._unsetupProviders();
    }
  })
};

exports.ShareProvider = ShareProvider;
