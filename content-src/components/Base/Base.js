const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const NewTabPage = require("components/NewTabPage/NewTabPage");
const DebugPage = require("components/DebugPage/DebugPage");

const {IntlProvider, addLocaleData} = require("react-intl");

// Add the locale data for pluralization and relative-time formatting
// for now, this just uses english locale data. We can make this more sophisticated if more
// features are needed.
function addLocaleDataForReactIntl(Intl) {
  addLocaleData([{locale: Intl.locale, parentLocale: "en"}]);
  document.documentElement.lang = Intl.locale;
  document.documentElement.dir = Intl.direction;
}

const Base = React.createClass({
  getInitialState() {return {showDebugPage: false};},
  componentWillMount() {
    addLocaleDataForReactIntl(this.props.Intl);
    this.props.dispatch(actions.NotifyPerf("BASE_MOUNTED"));
  },
  componentWillUpdate(nextProps) {
    if (nextProps.Intl !== this.props.Intl) {
      addLocaleDataForReactIntl(nextProps.Intl);
    }
  },
  render() {
    const debugLinkText = this.state.showDebugPage ? "newtab" : "debug";

    return (<IntlProvider locale={this.props.Intl.locale} messages={this.props.Intl.strings}><div id="base">
      {this.state.showDebugPage ? <DebugPage /> : <NewTabPage />}
      <a className="debug-link" href="" onClick={e => {
        e.preventDefault();
        this.setState({showDebugPage: !this.state.showDebugPage});
      }}>{debugLinkText}</a>
    </div></IntlProvider>);
  }
});

module.exports = connect(state => ({Intl: state.Intl}))(Base);
module.exports.Base = Base;
