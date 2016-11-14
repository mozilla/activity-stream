const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("common/selectors/selectors");
const {assignImageAndBackgroundColor} = require("common/selectors/colorSelectors");
const {Spotlight, SpotlightItem} = require("components/Spotlight/Spotlight");
const TopSites = require("components/TopSites/TopSites");
const faker = require("test/faker");
const sizeof = require("object-sizeof");
const {ShowAllHints} = require("common/action-manager").actions;
const experimentDefinitions = require("../../../experiments.json");
const UI_COMPONENTS = ["TopSites", "Highlights"];

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
  }
  return <span />;
}

const DebugPage = React.createClass({
  getInitialState() {
    return {
      component: "TopSites",
      dataSource: "TopSites",
      highlightData: [
        faker.createSpotlightItem(),
        faker.createSpotlightItem({type: "bookmark"}),
        faker.createSpotlightItem({isRecommended: true}),
        faker.createSpotlightItem({override: {syncedFrom: "Nick's iPhone"}}),
        faker.createSpotlightItem({override: {isOpen: true}})
      ]
    };
  },
  render() {
    const plainText = JSON.stringify({raw: this.props.raw, newTab: this.props.newTab}, null, 2);
    const downloadState = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.props.raw))}`;

    return (<main className="debug-page">
      <div className="new-tab-wrapper">

        <section className="experiments">
          <h2>Experiments</h2>
          <p>
            To override these experiments, check <code>about:config</code> for <code>extensions.@activity-streams.experiments.prefName</code>, where <code>prefName</code> is the name of the pref in this table.
          </p>
          <table className="experiment-table">
            <tr>
              <th>Experiment</th>
              <th>Pref name</th>
              <th>Description</th>
              <th>Value</th>
            </tr>
            {Object.keys(experimentDefinitions)
              .filter(id => experimentDefinitions[id].active)
              .map(id => {
                const valueAsString = JSON.stringify(this.props.raw.Experiments.values[id]);
                return (<tr key={id}>
                  <td>{experimentDefinitions[id].name}</td>
                  <td><code>{id}</code></td>
                  <td>{experimentDefinitions[id].description}</td>
                  <td>{valueAsString}</td>
                </tr>);
              })}
          </table>
        </section>

        <section>
          <h2>State as plain text</h2>
          <p>Apx. current size: {Math.round(sizeof(this.props.raw) / 1024)}kb</p>
          <p><a className="btn" href={downloadState} download="activity-stream-state.json">Download current state to file</a></p>
          <textarea value={plainText} />
          <Viewer {...this.props} />
        </section>

        <section>
          <h2>Tooltip Hints</h2>
          <button className="btn" onClick={() => this.props.dispatch(ShowAllHints())}>Show all tooltip hints</button>
        </section>

        <section>
          <h2>UI tester</h2>
          <div className="ui-tester">
            <div className="form-group">
              <label>UI Component</label>
              <select value={this.state.component} onChange={e => this.setState({component: e.target.value})}>
                {UI_COMPONENTS.map(component => <option key={component} value={component}>{component}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Data Source</label>
              <select value={this.state.dataSource} onChange={e => this.setState({dataSource: e.target.value})}>
                {Object.keys(this.props.raw).map(source => (<option key={source} value={source}>{source}</option>))}
              </select>
            </div>
          </div>
          <div>
            {this.state.component === "TopSites" &&
              <TopSites
                sites={this.props.raw[this.state.dataSource].rows}
                length={this.props.raw[this.state.dataSource].rows.length} />
            }
            {this.state.component === "Highlights" &&
              <Spotlight
                sites={assignImageAndBackgroundColor(this.props.raw[this.state.dataSource].rows)}
                length={this.props.raw[this.state.dataSource].rows.length} />
            }
          </div>
        </section>

        <section>
          <h2>Highlight Types</h2>
          {this.state.highlightData.map((item, i) => (
            <SpotlightItem key={i} {...item} />
          ))}
        </section>
      </div>
    </main>);
  }
});

module.exports = connect(state => ({
  newTab: selectNewTabSites(state),
  raw: state
}))(DebugPage);

module.exports.DebugPage = DebugPage;
