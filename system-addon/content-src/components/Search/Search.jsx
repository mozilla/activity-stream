/* globals ContentSearchUIController */
"use strict";
const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionCreators: ac} = require("common/Actions.jsm");

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onInputMount = this.onInputMount.bind(this);
  }

  handleEvent(event) {
    // Also track search events with our own telemetry
    if (event.detail.type === "Search") {
      this.props.dispatch(ac.UserEvent({event: "SEARCH"}));
    }
  }
  onClick(event) {
    this.controller.search(event);
  }
  onInputMount(input) {
    if (input) {
      this.controller = new ContentSearchUIController(input, input.parentNode,
        "activity", "newtab");
      addEventListener("ContentSearchClient", this);
    } else {
      this.controller = null;
      removeEventListener("ContentSearchClient", this);
    }
  }

  render() {
    return (<form className="search-wrapper">
      <label htmlFor="search-input" className="search-label">
        <span className="sr-only"><FormattedMessage id="search_web_placeholder" /></span>
      </label>
      <input
        id="search-input"
        maxLength="256"
        placeholder={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        ref={this.onInputMount}
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
