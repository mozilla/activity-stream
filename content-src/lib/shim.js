const fakeData = require("lib/fake-data");
const faker = require("test/faker");

function dispatch(action) {
  window.dispatchEvent(
    new CustomEvent("addon-to-content", {detail: action})
  );
}

module.exports = function() {
  window.addEventListener("content-to-addon", function(event) {
    const action = JSON.parse(event.detail);
    switch (action.type) {
      case "TOP_FRECENT_SITES_REQUEST":
        dispatch({type: "TOP_FRECENT_SITES_RESPONSE", data: fakeData.TopSites.rows.map(site => {
          return Object.assign({}, site, {
            // images: [],
            // favicon: null,
            // favicon_url: null,
            // favicon_colors: null,
            // description: null
          });
        })});
        break;
      case "RECENT_BOOKMARKS_REQUEST":
        if (action.meta && action.meta.append) {
          dispatch({
            type: "RECENT_BOOKMARKS_RESPONSE",
            data: faker.createRows({beforeDate: action.data.beforeDate, type: "bookmark"}),
            meta: {append: true}
          });
        } else {
          dispatch({type: "RECENT_BOOKMARKS_RESPONSE", data: fakeData.Bookmarks.rows});
        }
        break;
      case "RECENT_LINKS_REQUEST":
        if (action.meta && action.meta.append) {
          dispatch({
            type: "RECENT_LINKS_RESPONSE",
            data: faker.createRows({beforeDate: action.data.beforeDate}),
            meta: {append: true}
          });
        } else {
          dispatch({type: "RECENT_LINKS_RESPONSE", data: fakeData.History.rows});
        }
        break;
      case "FRECENT_LINKS_REQUEST":
        dispatch({type: "FRECENT_LINKS_RESPONSE", data: fakeData.FrecentHistory.rows.map(site => {
          return Object.assign({}, site, {
            // images: [],
            // favicon: null,
            // favicon_url: null,
            // favicon_colors: null,
            // description: null
          });
        })});
        break;
    }
  }, false);
};
