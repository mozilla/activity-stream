const React = require("react");
const ReactDOM = require("react-dom");
const {Provider} = require("react-redux");

const Main = require("components/Main/Main");
const store = require("./store");

const Root = React.createClass({
  render() {
    return (<Provider store={store}>
      <Main />
    </Provider>);
  }
});

// TODO: clean this up
window.dispatchEvent(new CustomEvent("content-to-addon", {
  detail: JSON.stringify({type: "REQUEST_TOP_FRECENT_SITES"}),
}));

window.addEventListener("addon-to-content", payload => {
  let msg = payload.detail;
  if (!msg.type) {
    console.warn(`Page.dispatch error: unknown message type`);
    return;
  }
  store.dispatch(msg);
});

module.exports = Root;
ReactDOM.render(<Root />, document.getElementById("root"));
