const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");

const NewTabPage = require("components/NewTabPage/NewTabPage");
const DebugPage = require("components/DebugPage/DebugPage");

const Base = React.createClass({
  getInitialState() {return {showDebugPage: false};},
  componentDidMount() {
    this.props.dispatch(actions.NotifyPerf("BASE_MOUNTED"));
  },
  render() {
    const debugLinkText = this.state.showDebugPage ? "newtab" : "debug";

    return (<div id="base">
      {this.state.showDebugPage ? <DebugPage /> : <NewTabPage />}
      <a className="debug-link" href="" onClick={e => {
        e.preventDefault();
        this.setState({showDebugPage: !this.state.showDebugPage});
      }}>{debugLinkText}</a>
    </div>);
  }
});

module.exports = connect(justDispatch)(Base);
