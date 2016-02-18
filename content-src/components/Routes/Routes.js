const React = require("react");
const {Router, Route, IndexRoute} = require("react-router");
const {createHashHistory} = require("history");

const history = createHashHistory({queryKey: false});

const Routes = React.createClass({
  render() {
    return (<Router history={history}>
      <Route path="/" component={require("components/Base/Base")}>
        <IndexRoute title="Home" component={require("components/NewTabPage/NewTabPage")} />
        <Route title="Activity Stream" path="timeline" icon="fa-timeline" component={require("components/TimelinePage/TimelinePage")} />
      </Route>
    </Router>);
  }
});

module.exports = Routes;
