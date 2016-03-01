const React = require("react");
const {Router, Route, IndexRoute} = require("react-router");
const {createHashHistory} = require("history");
const {connect} = require("react-redux");
const {actions} = require("actions/action-manager");

const history = createHashHistory({queryKey: false});

const Routes = React.createClass({
  onChange(data) {
    this.props.dispatch(actions.NotifyRouteChange(data));
  },
  render() {
    return (<Router history={history}>
      <Route path="/" component={require("components/Base/Base")}>
        <IndexRoute title="Home" component={require("components/NewTabPage/NewTabPage")} onEnter={data => this.onChange(data)} />
        <Route title="Activity Stream" path="timeline" component={require("components/TimelinePage/TimelinePage")}>
          <IndexRoute title="History" component={require("components/TimelinePage/TimelineHistory")} onEnter={data => this.onChange(data)} />
          <Route title="History" path="bookmarks" component={require("components/TimelinePage/TimelineBookmarks")} onEnter={data => this.onChange(data)} />
        </Route>
      </Route>
    </Router>);
  }
});

module.exports = connect(() => ({}))(Routes);
