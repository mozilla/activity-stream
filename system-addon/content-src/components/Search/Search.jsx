/* globals ContentSearchUIController */
"use strict";
const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionCreators: ac} = require("common/Actions.jsm");

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.controller = null;
    this.onClick = this.onClick.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onInputMount = this.onInputMount.bind(this);
  }
  handleEvent(event) {
    // Also track search events with our own telemetry
    if (event.detail.type === "Search") {
      this.props.dispatch(ac.UserEvent({event: "SEARCH"}));
    }
  }
  onInputMount(input) {
    this.input = input;
  }
  ensureSearchIsInitialized() {
    if (this.controller) {
      return;
    }
    // The first "newtab" parameter here is called the "healthReportKey" and needs
    // to be "newtab" so that BrowserUsageTelemetry.jsm knows to handle events with
    // this name, and can add the appropriate telemetry probes for search. Without the
    // correct name, certain tests like browser_UsageTelemetry_content.js will fail (See
    // github ticket #2348 for more details)
    this.controller = new ContentSearchUIController(this.input, this.input.parentNode,
      "newtab", "newtab");
  }
  onClick(event) {
    this.ensureSearchIsInitialized();
    this.controller.search(event);
  }
  onFocus(e) {
    this.ensureSearchIsInitialized();
  }
  componentDidMount() {
    addEventListener("ContentSearchClient", this);
  }
  componentWillUnmount() {
    this.controller = null;
    removeEventListener("ContentSearchClient", this);
  }

  /*
   * Do not change the ID on the input field, as legacy newtab code
   * specifically looks for the id 'newtab-search-text' on input fields
   * in order to execute searches in various tests
   */
  render() {
    return (<form className="search-wrapper">
      <label htmlFor="newtab-search-text" className="search-label">
        <span className="sr-only"><FormattedMessage id="search_web_placeholder" /></span>
      </label>
      <input
        id="newtab-search-text"
        ref={this.onInputMount}
        maxLength="256"
        onFocus={this.onFocus}
        placeholder={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        title={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        type="search" />
        <button
          className="search-button"
          onClick={this.onClick}
          title={this.props.intl.formatMessage({id: "search_button"})}>
          <span className="sr-only"><FormattedMessage id="search_button" /></span>
        </button>
    </form>);
  }
}

module.exports = connect()(injectIntl(Search));
module.exports._unconnected = Search;
