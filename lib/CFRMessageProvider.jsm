/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";
const BASE_ADDONS_DOWNLOAD_URL = "https://addons.mozilla.org/firefox/downloads/file";
const AMAZON_ASSISTANT_PARAMS = {
  existing_addons: ["abb@amazon.com", "{75c7fe97-5a90-4b54-9052-3534235eaf41}", "{ef34596e-1e43-4e84-b2ff-1e58e287e08d}", "{ea280feb-155a-492e-8016-ac96dd995f2c}", "izer@camelcamelcamel.com", "amptra@keepa.com", "pricealarm@icopron.ch", "{774f76c7-6807-481e-bf64-f9b7d5cda602}"],
  open_urls: ["smile.amazon.com", "www.audible.com", "www.amazon.com"],
  sumo_path: "extensionpromotions"
};
const FACEBOOK_CONTAINER_PARAMS = {
  existing_addons: ["@contain-facebook", "{bb1b80be-e6b3-40a1-9b6e-9d4073343f0b}", "{a50d61ca-d27b-437a-8b52-5fd801a0a88b}"],
  open_urls: ["www.facebook.com"],
  sumo_path: "extensionrecommendations"
};

const CFR_MESSAGES = [
  {
    id: "AMAZON_ASSISTANT_1",
    template: "cfr_doorhanger",
    content: {
      notification_text: "Recommendation",
      heading_text: "Recommended Extension",
      info_icon: {
        label: "why_seeing_this",
        sumo_path: AMAZON_ASSISTANT_PARAMS.sumo_path
      },
      addon: {
        title: "Amazon Assistant",
        icon: "",
        author: "Amazon",
        amo_url: "https://addons.mozilla.org/en-US/firefox/addon/amazon-browser-bar/"
      },
      text: "Amazon Assistant helps you make better shopping decisions by showing product comparisons at thousands of retail sites.",
      buttons: {
        primary: {
          label: "Add to Firefox",
          action: {
            type: "INSTALL_ADDON_FROM_URL",
            data: {url: `${BASE_ADDONS_DOWNLOAD_URL}/950930/amazon_assistant_for_firefox-10.1805.2.1019-an+fx.xpi`}
          }
        },
        secondary: {
          label: "No Thanks",
          action: {type: "CANCEL"}
        }
      }
    },
    frequency: {lifetime: 1},
    targeting: `
      (${JSON.stringify(AMAZON_ASSISTANT_PARAMS.existing_addons)} intersect addonsInfo.addons|keys)|length == 0 &&
      (${JSON.stringify(AMAZON_ASSISTANT_PARAMS.open_urls)} intersect topFrecentSites|mapToProperty('host'))|length > 0`,
    trigger: {id: "openURL", params: AMAZON_ASSISTANT_PARAMS.open_urls}
  },
  {
    id: "FACEBOOK_CONTAINER_1",
    template: "cfr_doorhanger",
    content: {
      notification_text: "Recommendation",
      heading_text: "Recommended Extension",
      info_icon: {
        label: "why_seeing_this",
        sumo_path: FACEBOOK_CONTAINER_PARAMS.sumo_path
      },
      addon: {
        title: "Facebook Container",
        icon: "",
        author: "Mozilla",
        amo_url: "https://addons.mozilla.org/en-US/firefox/addon/facebook-container/"
      },
      text: "Stop Facebook from tracking your activity across the web. Use Facebook the way you normally do without annoying ads following you around.",
      buttons: {
        primary: {
          label: "Add to Firefox",
          action: {
            type: "INSTALL_ADDON_FROM_URL",
            data: {url: `${BASE_ADDONS_DOWNLOAD_URL}/950930/918624/facebook_container-1.3.1-an+fx-linux.xpi`}
          }
        },
        secondary: {
          label: "No Thanks",
          action: {type: "CANCEL"}
        }
      }
    },
    frequency: {lifetime: 1},
    targeting: `
      (${JSON.stringify(FACEBOOK_CONTAINER_PARAMS.existing_addons)} intersect addonsInfo.addons|keys)|length == 0 &&
      (${JSON.stringify(FACEBOOK_CONTAINER_PARAMS.open_urls)} intersect topFrecentSites|mapToProperty('host'))|length > 0`,
    trigger: {id: "openURL", params: FACEBOOK_CONTAINER_PARAMS.open_urls}
  }
];

const CFRMessageProvider = {
  getMessages() {
    return CFR_MESSAGES;
  }
};
this.CFRMessageProvider = CFRMessageProvider;

const EXPORTED_SYMBOLS = ["CFRMessageProvider"];
