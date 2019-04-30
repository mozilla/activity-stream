/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";
const {Localization} = ChromeUtils.import("resource://gre/modules/Localization.jsm");
const {FxAccountsConfig} = ChromeUtils.import("resource://gre/modules/FxAccountsConfig.jsm");
const {AttributionCode} = ChromeUtils.import("resource:///modules/AttributionCode.jsm");
const {AddonRepository} = ChromeUtils.import("resource://gre/modules/addons/AddonRepository.jsm");

async function getAddonInfo() {
  try {
    let {content, source} = await AttributionCode.getAttrDataAsync();
    if (!content || source !== "addons.mozilla.org") {
      return null;
    }
    // Attribution data can be double encoded
    while (content.includes("%")) {
      try {
        const result = decodeURIComponent(content);
        if (result === content) {
          break;
        }
        content = result;
      } catch (e) {
        break;
      }
    }
    const [addon] = await AddonRepository.getAddonsByIDs([content]);
    if (addon.sourceURI.scheme !== "https") {
      return null;
    }
    return {
      name: addon.name,
      url: addon.sourceURI.spec,
      iconURL: addon.icons["64"] || addon.icons["32"],
    };
  } catch (e) {
    Cu.reportError("Failed to get the latest add-on version for Return to AMO");
    return null;
  }
}

const L10N = new Localization([
  "branding/brand.ftl",
  "browser/branding/sync-brand.ftl",
  "browser/newtab/onboarding.ftl",
]);

const ONBOARDING_MESSAGES = async () => ([
  {
    id: "ONBOARDING_1",
    template: "onboarding",
    bundled: 3,
    order: 2,
    content: {
      title: {string_id: "onboarding-private-browsing-title"},
      text: {string_id: "onboarding-private-browsing-text"},
      icon: "privatebrowsing",
      primary_button: {
        label: {string_id: "onboarding-button-label-try-now"},
        action: {type: "OPEN_PRIVATE_BROWSER_WINDOW"},
      },
    },
    trigger: {id: "showOnboarding"},
  },
  {
    id: "ONBOARDING_2",
    template: "onboarding",
    bundled: 3,
    order: 3,
    content: {
      title: {string_id: "onboarding-screenshots-title"},
      text: {string_id: "onboarding-screenshots-text"},
      icon: "screenshots",
      primary_button: {
        label: {string_id: "onboarding-button-label-try-now"},
        action: {
          type: "OPEN_URL",
          data: {args: "https://screenshots.firefox.com/#tour", where: "tabshifted"},
        },
      },
    },
    trigger: {id: "showOnboarding"},
  },
  {
    id: "ONBOARDING_3",
    template: "onboarding",
    bundled: 3,
    order: 1,
    content: {
      title: {string_id: "onboarding-addons-title"},
      text: {string_id: "onboarding-addons-text"},
      icon: "addons",
      primary_button: {
        label: {string_id: "onboarding-button-label-try-now"},
        action: {
          type: "OPEN_ABOUT_PAGE",
          data: {args: "addons"},
        },
      },
    },
    targeting: "attributionData.campaign != 'non-fx-button' && attributionData.source != 'addons.mozilla.org'",
    trigger: {id: "showOnboarding"},
  },
  {
    id: "ONBOARDING_4",
    template: "onboarding",
    bundled: 3,
    order: 1,
    content: {
      title: {string_id: "onboarding-ghostery-title"},
      text: {string_id: "onboarding-ghostery-text"},
      icon: "gift",
      primary_button: {
        label: {string_id: "onboarding-button-label-try-now"},
        action: {
          type: "OPEN_URL",
          data: {args: "https://addons.mozilla.org/en-US/firefox/addon/ghostery/", where: "tabshifted"},
        },
      },
    },
    targeting: "providerCohorts.onboarding == 'ghostery'",
    trigger: {id: "showOnboarding"},
  },
  {
    id: "ONBOARDING_5",
    template: "onboarding",
    bundled: 3,
    order: 4,
    content: {
      title: {string_id: "onboarding-fxa-title"},
      text: {string_id: "onboarding-fxa-text"},
      icon: "sync",
      primary_button: {
        label: {string_id: "onboarding-button-label-get-started"},
        action: {
          type: "OPEN_URL",
          data: {args: await FxAccountsConfig.promiseEmailFirstURI("onboarding"), where: "tabshifted"},
        },
      },
    },
    targeting: "attributionData.campaign == 'non-fx-button' && attributionData.source == 'addons.mozilla.org'",
    trigger: {id: "showOnboarding"},
  },
  {
    id: "TRAILHEAD",
    template: "trailhead",
    targeting: "localeLanguageCode == 'en' && trailheadCohort > 0",
    trigger: {id: "firstRun"},
    includeBundle: {length: 3, template: "onboarding", trigger: {id: "showOnboarding"}},
    content: {},
  },
  {
    id: "FXA_1",
    template: "fxa_overlay",
    trigger: {id: "firstRun"},
  },
  {
    id: "RETURN_TO_AMO_1",
    template: "return_to_amo_overlay",
    content: {
      header: {string_id: "onboarding-welcome-header"},
      title: {string_id: "return-to-amo-sub-header"},
      addon_icon: null,
      icon: "gift-extension",
      text: {string_id: "return-to-amo-addon-header", args: {"addon-name": null}},
      primary_button: {
        label: {string_id: "return-to-amo-extension-button"},
        action: {
          type: "INSTALL_ADDON_FROM_URL",
          data: {url: null},
        },
      },
      secondary_button: {
        label: {string_id: "return-to-amo-get-started-button"},
      },
    },
    targeting: "attributionData.campaign == 'non-fx-button' && attributionData.source == 'addons.mozilla.org'",
    trigger: {id: "firstRun"},
  },
]);

const OnboardingMessageProvider = {
  async getExtraAttributes() {
    const [header, button_label] = await L10N.formatMessages([
      {id: "onboarding-welcome-header"},
      {id: "onboarding-start-browsing-button-label"},
    ]);
    return {header: header.value, button_label: button_label.value};
  },
  async getMessages() {
    const messages = await this.translateMessages(await ONBOARDING_MESSAGES());
    return messages;
  },
  async getUntranslatedMessages() {
    // This is helpful for jsonSchema testing - since we are localizing in the provider
    const messages = await ONBOARDING_MESSAGES();
    return messages;
  },
  async translateMessages(messages) {
    let translatedMessages = [];
    for (const msg of messages) {
      let translatedMessage = {...msg};

      // If the message has no content, do not attempt to translate it
      if (!translatedMessage.content) {
        translatedMessages.push(translatedMessage);
        continue;
      }

      // We need some addon info if we are showing return to amo overlay, so fetch
      // that, and update the message accordingly
      if (msg.template === "return_to_amo_overlay") {
        try {
          const {name, iconURL, url} = await getAddonInfo();
          // If we do not have all the data from the AMO api to indicate to the user
          // what they are installing we don't want to show the message
          if (!name || !iconURL || !url) {
            continue;
          }

          msg.content.text.args["addon-name"] = name;
          msg.content.addon_icon = iconURL;
          msg.content.primary_button.action.data.url = url;
        } catch (e) {
          continue;
        }
      }

      // Translate any secondary buttons separately
      if (msg.content.secondary_button) {
        const [secondary_button_string] = await L10N.formatMessages([{id: msg.content.secondary_button.label.string_id}]);
        translatedMessage.content.secondary_button.label = secondary_button_string.value;
      }
      if (msg.content.header) {
        const [header_string] = await L10N.formatMessages([{id: msg.content.header.string_id}]);
        translatedMessage.content.header = header_string.value;
      }
      translatedMessages.push(translatedMessage);
    }
    return translatedMessages;
  },
};
this.OnboardingMessageProvider = OnboardingMessageProvider;

const EXPORTED_SYMBOLS = ["OnboardingMessageProvider"];
