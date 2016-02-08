const fakeFrecent = [
  {
    title: "Facebook",
    image: "https://www.facebook.com/images/fb_icon_325x325.png",
    url: "https://www.facebook.com",
    type: "website"
  },
  {
    title: "Youtube",
    image: "//s.ytimg.com/yts/img/yt_1200-vfl4C3T0K.png",
    description: "Share your videos with friends, family, and the world",
    type: "website",
    url: "https://youtube.com"
  },
  {
    title: "Github",
    image: "https://github.com/apple-touch-icon-144x144.png",
    url: "https://github.com",
    description: "GitHub is where people build software. More than 12 million people use GitHub to discover, fork, and contribute to over 31 million projects."
  },
  {
    title: "Hacker News",
    type: "website",
    image: "https://news.ycombinator.com/y18.gif",
    url: "https://news.ycombinator.com"
  },
  {
    title: "CNN - Breaking News, Latest News and Videos",
    type: "website",
    description: "View the latest news and breaking news today for U.S., world, weather, entertainment, politics and health at CNN.com.",
    image: "http://i.cdn.turner.com/cnn/.e/img/3.0/global/misc/apple-touch-icon.png",
    url: "http://www.cnn.com/"
  },
  {
    title: "reddit: the front page of the internet",
    type: "website",
    url: "https://www.reddit.com",
    image: "//www.redditstatic.com/icon-touch.png"
  }
];

const fakeBookmarks = [
  {
    title: "Facebook",
    image: "https://www.facebook.com/images/fb_icon_325x325.png",
    url: "https://www.facebook.com",
    type: "website"
  },
  {
    title: "Cruz and Trump, signs of conservative media's grip on GOP (Opinion) - CNN.com",
    url: "http://www.cnn.com/2016/02/03/opinions/conservative-media-power-smerconish-rosenwald/index.html",
    type: "article",
    image: "http://i2.cdn.turner.com/cnnnext/dam/assets/160127114716-ted-cruz-donald-trump-composite-large-169.jpg",
    description: "Rosenwald and Smerconish say GOP leaders have bowed down to the power of conservative media, costing the party and the government dearly"
  },
  {
    title: "The Bouqs Gains A $12 Million Bushel in Series B Financing To Grow The Business",
    type: "article",
    image: "https://tctechcrunch2011.files.wordpress.com/2016/02/desperado-wrap.jpg?w=764&h=400&crop=1",
    url: "http://social.techcrunch.com/2016/02/03/the-bouqs-gains-a-12-million-bushel-in-series-b-financing-to-grow-the-business",
    description: "We're a week and a half away from Valentine's Day, one of the biggest days for flower purchases everywhere and probably the best time for The Bouqs, an.."
  }
];

function dispatch(action) {
  window.dispatchEvent(
    new CustomEvent('addon-to-content', {detail: action})
  );
}

module.exports = function () {
  window.addEventListener('content-to-addon', function (event) {
    const action = JSON.parse(event.detail);
    switch(action.type) {
      case 'TOP_FRECENT_SITES_REQUEST':
        dispatch({type: 'TOP_FRECENT_SITES_RESPONSE', data: fakeFrecent});
        break;
      case 'RECENT_BOOKMARKS_REQUEST':
        dispatch({type: 'RECENT_BOOKMARKS_RESPONSE', data: fakeBookmarks});
    }
  }, false);
};

module.exports.data = {
  fakeFrecent,
  fakeBookmarks
};
