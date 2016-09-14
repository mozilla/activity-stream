/* globals require, exports, XPCOMUtils, CustomizableUI, Services, Social, Task */

const {Cc, Ci, Cu} = require("chrome");
const {data} = require("sdk/self");
const DEFAULT_MANIFEST_PREFS = require("addon/ShareManifests");

const clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);

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

const PROVIDER_SORT = ["Facebook", "Twitter", "Tumblr", "LinkedIn", "Yahoo Mail", "Gmail"];

let SocialService;
try {
  SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;
} catch (e) {
  // For Firefox 51+
  SocialService = Cu.import("resource:///modules/SocialService.jsm", {}).SocialService;
}

function windowProperty(window, shareProvider) {
  return {
    configurable: true,
    enumerable: true,
    writable: true,
    value: {
      copyLink: url => {
        shareProvider.copyLink(url, "SHARE_TOOLBAR");
      },
      emailLink: (url, title) => {
        shareProvider.emailLink(url, title, window, "SHARE_TOOLBAR");
      },
      sharePage: (providerOrigin, graphData, target) => {
        shareProvider.shareLink(providerOrigin, graphData, target, window, "SHARE_TOOLBAR");
      }
    }
  };
}

// This is to register a ShareUtils object in the browser chrome window and
// to hide the existing social share (paper airplane) button.
const Overlay = {
  init: shareProvider => {
    for (let win of CustomizableUI.windows) {
      Overlay.setWindowScripts(win, shareProvider);
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

      // unmonkeypatch SocialActivationListener.receiveMessage
      win.SocialActivationListener.receiveMessage = win.SocialActivationListener.originalReceiveMessage;
      delete win.SocialActivationListener.originalReceiveMessage;
    }
  },
  observe: window => {
    Overlay.setWindowScripts(window);
  },
  setWindowScripts: (window, shareProvider) => {
    Object.defineProperty(window, "ShareUtils", windowProperty(window, shareProvider));

    if (window.SocialShare.shareButton) {
      window.SocialShare.shareButton.setAttribute("hidden", "true");
    }

    // monkeypatch SocialActivationListener.receiveMessage
    window.SocialActivationListener.originalReceiveMessage = window.SocialActivationListener.receiveMessage;
    window.SocialActivationListener.receiveMessage = function(aMessage) {
      // NOTE: This is a patched version of SocialActivationListener.receiveMessage
      // that doesn't install the shareplane button to the toolbar when a new provider
      // is activated.
      // original code is at mozilla-central/source/browser/base/content/browser-social.js
      let data = aMessage.json;
      data.window = window;
      const {
        gBrowser,
        Social
      } = window;

      Social.installProvider(data, manifest => {
        Social.activateFromOrigin(manifest.origin, provider => {
          if (provider.postActivationURL) {
            // if activated from an open share panel, we load the landing page in
            // a background tab
            gBrowser.loadOneTab(provider.postActivationURL, {inBackground: false});
          }
        });
      }, {});
    };
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
    Overlay.init(this);
  }),

  /**
   * Return the installed social share providers.
   */
  get socialProviders() {
    let providers = Social.providers.filter(p => p.shareURL);
    for (let provider of providers) {
      let index = PROVIDER_SORT.indexOf(provider.name);
      if (index < 0) {
        index = 99;
      }
      provider.sortIndex = index;
    }
    providers.sort((a, b) => a.sortIndex - b.sortIndex);
    return providers.map(p => ({
      "name": p.name,
      "origin": p.origin,
      "iconURL": p.iconURL
    }));
  },

  /**
   * Copy the given url to the clipboard.
   */
  copyLink(url, userEvent = "SHARE") {
    clipboard.copyString(url);
    this.eventTracker.handleUserEvent({
      event: userEvent,
      provider: "copy-link"
    });
  },

  /**
   * Share the given url and title to the user's default mail client.
   */
  emailLink(url, title, window, userEvent = "SHARE") {
    window.MailIntegration.sendMessage(url, title);
    this.eventTracker.handleUserEvent({
      event: userEvent,
      provider: "email-link"
    });
  },

  /**
   * Share the given url to the given social provider.
   */
  shareLink(providerOrigin, graphData, target, window, userEvent = "SHARE") {
    // based on SocialShare.sharePage in browser-social.js
    // target would be item clicked on for a context menu, but not handled in this case
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
    let sharedURI;
    if (pageData) {
      sharedURI = Services.io.newURI(pageData.url, null, null);
    } else {
      sharedURI = gBrowser.currentURI;
    }
    if (SocialUI.canShareOrMarkPage ? // canShareOrMarkPage was changed to canSharePage in FF 51
        !SocialUI.canShareOrMarkPage(sharedURI) :
        !SocialUI.canSharePage(sharedURI)) {
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
    let features = "chrome,resizable,scrollbars=yes";

    let size = provider.getPageSize("share");
    if (size && size.width) {
      features = `${features},innerWidth=${size.width}`;
    }
    if (size && size.height) {
      features = `${features},innerHeight=${size.height}`;
    }
    window.open(shareEndpoint, `share-dialog-${provider.name}`, features).focus();

    this.eventTracker.handleUserEvent({
      event: userEvent,
      provider: provider.origin
    });
  },

  /**
   * Set up the prefs and enable a default set of social providers if the user
   * hasn't enabled any.
   */
  _setupProviders: Task.async(function*() {
    if (!SocialService.hasEnabledProviders) {
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
    if (Services.prefs.prefHasUserValue("social.enabledByActivityStream") &&
        Services.prefs.getBoolPref("social.enabledByActivityStream")) {
      let promises = [];
      for (let key of Object.keys(DEFAULT_MANIFEST_PREFS)) {
        let manifest = DEFAULT_MANIFEST_PREFS[key];
        if (Social.providers.filter(p => p.origin === manifest.origin).length === 0) {
          // If the user uninstalled the provider, don't try to uninstall again.
          continue;
        }
        let _key = key;
        promises.push(new Promise(resolve => {
          SocialService.uninstallProvider(manifest.origin, () => {
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
      CustomizableUI.destroyWidget(id);
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
        let view = doc.getElementById("PanelUI-shareMenuView");
        if (view) {
          view.remove();
        }
        view = doc.createElement("panelview");
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
          "oncommand": "ShareUtils.emailLink(gBrowser.currentURI.spec, gBrowser.selectedBrowser.contentTitle);"
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "menuseparator", {"id": "menu_shareMenuSeparator"});
        view.appendChild(item);

        let providers = this.socialProviders;
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

        // The Social API changed in FF 51
        if (Services.vc.compare(Services.appinfo.version, "51.0a1") >= 0) {
          node.setAttribute("observes", "Social:PageShareable");
        } else {
          node.setAttribute("observes", "Social:PageShareOrMark");
        }

        CustomizableUI.addListener(shareButton);
        Services.obs.addObserver(shareButton, "social:providers-changed", false);
      },
      onDestroyed: () => {
        Services.obs.removeObserver(shareButton, "social:providers-changed");
        CustomizableUI.removeListener(shareButton);
      },
      onCustomizeEnd: window => {
        let url = window.gBrowser.currentURI;
        if (window.SocialUI.canShareOrMarkPage ? // canShareOrMarkPage was changed to canSharePage in FF 51
            window.SocialUI.canShareOrMarkPage(url) :
            window.SocialUI.canSharePage(url)) {
          widget.disabled = false;
        }
      },
      observe: (aSubject, aTopic, aData) => {
        for (let win of CustomizableUI.windows) {
          let document = win.document;
          shareButton.populateProviderMenu(document);
        }
      }
    };

    widget = CustomizableUI.createWidget(shareButton);
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
