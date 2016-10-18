const fakeData = require("lib/fake-data");
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
      case "HIGHLIGHTS_LINKS_REQUEST":
        dispatch({type: "HIGHLIGHTS_LINKS_RESPONSE", data: fakeData.Highlights.rows});
        break;
    }
  }, false);
};
