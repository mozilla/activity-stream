const IMAGE_PATH = "img/";
const FIRST_RUN_TYPE = "first-run";
const FAVICON_PATH = "favicons/images/";

module.exports = {
  FIRST_RUN_TYPE,
  TopSites: [
    {
      "title": "Facebook",
      "url": "https://www.facebook.com/",
      "favicon_url": "facebook-com.png",
      "background_color": "#edf0f5"
    },
    {
      "title": "YouTube",
      "url": "https://www.youtube.com/",
      "favicon_url": "youtube-com.png",
      "background_color": "#fff"
    },
    {
      "title": "Amazon",
      "url": "http://www.amazon.com/",
      "favicon_url": "amazon-com.png",
      "background_color": "#FFF"
    },
    {
      "title": "Yahoo",
      "url": "https://www.yahoo.com/",
      "favicon_url": "yahoo-com.png",
      "background_color": "#5009a7"
    },
    {
      "title": "eBay",
      "url": "http://www.ebay.com",
      "favicon_url": "ebay-com.png",
      "background_color": "#ededed"
    },
    {
      "title": "Twitter",
      "url": "https://twitter.com/",
      "favicon_url": "twitter-com.png",
      "background_color": "#049ff5"
    }
  ].map(item => {
    item.favicon_url = FAVICON_PATH + item.favicon_url;
    return item;
  }),
  Highlights: [
    {
      "title": "Firefox Sync",
      "description": "Take your Web with you",
      "url": "https://www.mozilla.org/firefox/sync/",
      "image_url": "firstrun-sync.png",
      "favicon_url": "firstrun-sync-icon.png",
      "background_color": "#5AC6f8",
      "context_message": "Save everywhere"
    },
    {
      "title": "More ways to customize",
      "description": "Themes and add-ons allow you to customize Firefox",
      "url": "https://www.mozilla.org/firefox/desktop/customize/",
      "image_url": "firstrun-customize.png",
      "favicon_url": "firstrun-customize-icon.png",
      "background_color": "#735C72",
      "context_message": "Extend Firefox"
    },
    {
      "title": "Get Firefox on all your devices",
      "description": "Install Firefox for Android and iOS from your favorite app store",
      "url": "https://www.mozilla.org/firefox/android/",
      "image_url": "firstrun-mobile.png",
      "favicon_url": "firstrun-mobile-icon.png",
      "background_color": "#0775A7",
      "context_message": "Complete your install"
    }
  ].map(item => {
    item.type = FIRST_RUN_TYPE;
    item.images = [
      {
        url: IMAGE_PATH + item.image_url,
        width: 450,
        height: 278
      }
    ];
    delete item.image_url;
    item.favicon_url = IMAGE_PATH + item.favicon_url;
    return item;
  })
};
