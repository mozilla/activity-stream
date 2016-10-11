const React = require("react");
const {Router, Route, IndexRoute, createMemoryHistory} = require("react-router");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const history = createMemoryHistory(document.location.hash.slice(1) || "/");
let isFirstLoad = true;

const Routes = React.createClass({
  componentDidMount() {
    this.unlisten = history.listen(location => {
      this.props.dispatch(actions.NotifyRouteChange(Object.assign({}, location, {isFirstLoad})));
      if (isFirstLoad) {
        isFirstLoad = false;
      }
      window.scroll(0, 0);
    });
  },
  componentWillUnmount() {
    this.unlisten();
  },
  render() {
    return (<Router history={history}>
      <Route path="/" component={require("components/Base/Base")}>
        <IndexRoute title="Home" component={require("components/NewTabPage/NewTabPage")} />
        <Route title="DebugPage" path="debug" component={require("components/DebugPage/DebugPage")} />
      </Route>
    </Router>);
  }
});

module.exports = connect(() => ({}))(Routes);
