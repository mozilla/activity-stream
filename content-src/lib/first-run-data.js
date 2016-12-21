const FIRST_RUN_TYPE = "first-run";
const FAVICON_PATH = "favicons/images/";

module.exports = {
  FIRST_RUN_TYPE,
  TopSites: [
    {
      "title": "Facebook",
      "url": "https://www.facebook.com/",
      "favicon_url": "facebook-com.png",
      "background_color": [237, 240, 245]
    },
    {
      "title": "YouTube",
      "url": "https://www.youtube.com/",
      "favicon_url": "youtube-com.png",
      "background_color": [219, 67, 56]
    },
    {
      "title": "Amazon",
      "url": "http://www.amazon.com/",
      "favicon_url": "amazon-com.png",
      "background_color": [255, 255, 255]
    },
    {
      "title": "Yahoo",
      "url": "https://www.yahoo.com/",
      "favicon_url": "yahoo-com.png",
      "background_color": [80, 9, 167]
    },
    {
      "title": "eBay",
      "url": "http://www.ebay.com",
      "favicon_url": "ebay-com.png",
      "background_color": [237, 237, 237]
    },
    {
      "title": "Twitter",
      "url": "https://twitter.com/",
      "favicon_url": "twitter-com.png",
      "background_color": [4, 159, 245]
    }
  ].map(item => {
    item.type = FIRST_RUN_TYPE;
    item.favicon_url = FAVICON_PATH + item.favicon_url;
    return item;
  })
};
