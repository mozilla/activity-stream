/* globals addMessageListener, removeMessageListener */
const React = require("react");
const ReactDOM = require("react-dom");
const Base = require("content-src/components/Base/Base");

function render(props) {
  ReactDOM.render(<Base {...props} />, document.getElementById("root"));
}

// This listens for an inititalization message with the initial state of the page.
// TODO: When we add Redux, move this to middleware.
function onActionFromMain(msg) {
  const action = msg.data;
  switch (action.type) {
    case "NEW_TAB_INITIAL_STATE":
      render(action.data);
      removeMessageListener(onActionFromMain);
      break;
  }
}

addMessageListener("ActivityStream:MainToContent", onActionFromMain);
