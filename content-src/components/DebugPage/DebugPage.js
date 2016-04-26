const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites, selectSpotlight} = require("selectors/selectors");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const TopSites = require("components/TopSites/TopSites");

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
  getInitialState() {
    return {
      component: "Spotlight",
      dataSource: "Highlights"
    };
  },
  render() {
    const plainText = JSON.stringify({raw: this.props.raw, newTab: this.props.newTab}, null, 2);
    return (<main className="debug-page">
      <div className="new-tab-wrapper">
        <h2>Plain text</h2>
        <textarea value={plainText} />
        <Viewer {...this.props} />

        <h2>UI tester</h2>
        <div className="ui-tester">
          <div className="form-group">
            <label>UI Component</label>
            <select value={this.state.component} onChange={e => this.setState({component: e.target.value})}>
              <option value={"Spotlight"}>Spotlight</option>
              <option value={"TopSites"}>Top Sites</option>
              <option value={"ActivityFeed"}>Activity Feed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Data Source</label>
            <select value={this.state.dataSource} onChange={e => this.setState({dataSource: e.target.value})}>
              {Object.keys(this.props.raw).map(source => {
                return (<option key={source} value={source}>{source}</option>);
              })}
            </select>
          </div>
        </div>
        <div>
          {this.state.component === "Spotlight" &&
            <div className="spotlight">
              {selectSpotlight({
                Highlights: this.props.raw[this.state.dataSource],
                Blocked: {urls: new Set()}
              }).rows.map((item, i) => {
                return (<SpotlightItem key={i} {...item} />);
              })}
            </div>
          }
          {this.state.component === "TopSites" &&
            <TopSites
              sites={this.props.raw[this.state.dataSource].rows}
              length={this.props.raw[this.state.dataSource].rows.length} />
          }
          {this.state.component === "ActivityFeed" &&
            <GroupedActivityFeed
              sites={this.props.raw[this.state.dataSource].rows}
              length={this.props.raw[this.state.dataSource].rows.length} />
          }
        </div>
      </div>
    </main>);
  }
});

module.exports = connect(state => {
  return {
    newTab: selectNewTabSites(state),
    raw: {
      TopSites: state.TopSites,
      History: state.History,
      Bookmarks: state.Bookmarks,
      Highlights: state.Highlights,
    }
  };
})(DebugPage);

module.exports.DebugPage = DebugPage;
