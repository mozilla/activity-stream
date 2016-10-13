const fakeData = require("lib/fake-data");
const faker = require("test/faker");
const {ADDON_TO_CONTENT, CONTENT_TO_ADDON} = require("common/event-constants");

function dispatch(action) {
  window.dispatchEvent(
    new CustomEvent(ADDON_TO_CONTENT, {detail: action})
  );
}

module.exports = function() {
  window.addEventListener(CONTENT_TO_ADDON, event => {
    const action = JSON.parse(event.detail);
    switch (action.type) {
      case "TOP_FRECENT_SITES_REQUEST":
        dispatch({
          type: "TOP_FRECENT_SITES_RESPONSE",
          data: fakeData.TopSites.rows.map(site => Object.assign({}, site, { // eslint-disable-line object-curly-newline
            // images: [],
            // favicon: null,
            // favicon_url: null,
            // favicon_colors: null,
            // description: null
          })) // eslint-disable-line object-curly-newline
        });
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
      case "HIGHLIGHTS_LINKS_REQUEST":
        dispatch({type: "HIGHLIGHTS_LINKS_RESPONSE", data: fakeData.Highlights.rows});
        break;
    }
  }, false);
};
