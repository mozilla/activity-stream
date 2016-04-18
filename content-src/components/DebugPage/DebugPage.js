const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("selectors/selectors");

// Only include this in DEVELOPMENT builds
let JSONTree;
if (__CONFIG__.DEVELOPMENT) {
  JSONTree = require("react-json-inspector");
}

function Viewer(props) {
  if (__CONFIG__.DEVELOPMENT) {
    return (<div>
      <h2>Raw state (returned from reducers)</h2>
      <JSONTree search={false} data={props.raw} />
      <h2>Deduped new tab state</h2>
      <JSONTree search={false} data={props.newTab} />
    </div>);
  } else {
    return <span />;
  }
}

const DebugPage = React.createClass({
  render() {
    const plainText = JSON.stringify({raw: this.props.raw, newTab: this.props.newTab}, null, 2);
    return (<main className="debug-page">
      <div className="new-tab-wrapper">
        <h2>Plain text</h2>
        <textarea value={plainText} />
        <Viewer {...this.props} />
      </div>
    </main>);
  }
});

module.exports = connect(state => {
  return {
    newTab: selectNewTabSites(state),
    raw: {
      TopSites: state.TopSites,
      FrecentHistory: state.FrecentHistory,
      History: state.History,
      Bookmarks: state.Bookmarks,
      Highlights: state.Highlights,
    }
  };
})(DebugPage);

module.exports.DebugPage = DebugPage;
