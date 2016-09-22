const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites, selectSpotlight} = require("selectors/selectors");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const TopSites = require("components/TopSites/TopSites");
const faker = require("test/faker");

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
      component: "Spotlight",
      dataSource: "Highlights",
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
    return (<main className="debug-page">
      <div className="new-tab-wrapper">
        <section>
          <h2>Plain text</h2>
          <textarea value={plainText} />
          <Viewer {...this.props} />
        </section>

        <section>
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
                {Object.keys(this.props.raw).map(source => (<option key={source} value={source}>{source}</option>))}
              </select>
            </div>
          </div>
          <div>
            {this.state.component === "Spotlight" &&
              <div className="spotlight">
                {selectSpotlight({
                  Highlights: this.props.raw[this.state.dataSource],
                  WeightedHighlights: this.props.raw[this.state.dataSource],
                  Prefs: this.props.raw.Prefs,
                  Experiments: this.props.raw.Experiments
                }).rows.map((item, i) =>
                  (<SpotlightItem key={i} {...item} />))
                }
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
