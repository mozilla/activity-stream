const React = require("react");
const {Router, Route, IndexRoute} = require("react-router");
const {createHashHistory} = require("history");

const history = createHashHistory({queryKey: false});

const Routes = React.createClass({
  render() {
    return (<Router history={history}>
      <Route path="/" component={require("components/Base/Base")}>
        <IndexRoute title="Home" component={require("components/NewTabPage/NewTabPage")} />
        <Route title="Activity Stream" path="timeline" component={require("components/TimelinePage/TimelinePage")}>
          <IndexRoute title="History" component={require("components/TimelinePage/TimelineHistory")} />
          <Route title="History" path="bookmarks" component={require("components/TimelinePage/TimelineBookmarks")} />
        </Route>
      </Route>
    </Router>);
  }
});

module.exports = Routes;
