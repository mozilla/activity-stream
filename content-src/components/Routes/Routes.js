const React = require("react");
const {Router, Route, IndexRoute, useRouterHistory} = require("react-router");
const {createHashHistory} = require("history");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const history = useRouterHistory(createHashHistory)({queryKey: false});
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
        <Route title="Activity Stream" path="timeline" component={require("components/TimelinePage/TimelinePage")}>
          <IndexRoute title="History" component={require("components/TimelinePage/TimelineHistory")} />
          <Route title="History" path="bookmarks" component={require("components/TimelinePage/TimelineBookmarks")} />
        </Route>
      </Route>
    </Router>);
  }
});

module.exports = connect(() => ({}))(Routes);
