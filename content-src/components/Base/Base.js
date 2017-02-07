const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const NewTabPage = require("components/NewTabPage/NewTabPage");
const DebugPage = require("components/DebugPage/DebugPage");

const {IntlProvider, addLocaleData} = require("react-intl");

const Base = React.createClass({
  getInitialState() {return {showDebugPage: false};},
  componentDidMount() {
    // Add the locale data for pluralization and relative-time formatting
    addLocaleData([{locale: this.props.Intl.locale, parentLocale: "en"}]);
    document.documentElement.lang = this.props.Intl.locale;
    this.props.dispatch(actions.NotifyPerf("BASE_MOUNTED"));
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
