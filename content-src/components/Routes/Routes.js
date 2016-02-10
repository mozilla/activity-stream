const React = require("react");
const {Router, Route, IndexRoute} = require("react-router");
const {createHashHistory} = require("history");

const Base = require("components/Base/Base");
const NewTabPage = require("components/NewTabPage/NewTabPage");
const TimelinePage = require("components/TimelinePage/TimelinePage");

const history = createHashHistory({queryKey: false});

class Routes extends React.Component {
  render() {
    return (<Router history={history}>
      <Route path="/" component={Base}>
        <IndexRoute title="Home" component={NewTabPage} />
        <Route title="Timeline" path="timeline" component={TimelinePage} />
      </Route>
    </Router>);
  }
}

module.exports = Routes;
