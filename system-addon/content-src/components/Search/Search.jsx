"use strict";
const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionTypes, actionCreators} = require("common/Actions.jsm");

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {searchString: ""};
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  performSearch(options) {
    let searchData = {
      engineName: options.engineName,
      searchString: options.searchString,
      searchPurpose: "newtab",
      healthReportKey: "newtab"
    };
    this.props.dispatch(actionCreators.SendToMain({type: actionTypes.PERFORM_SEARCH, data: searchData}));
  }
  onClick(event) {
    const {currentEngine} = this.props.Search;
    event.preventDefault();
    this.performSearch({engineName: currentEngine.name, searchString: this.state.searchString});
  }
  onChange(event) {
    this.setState({searchString: event.target.value});
  }
  render() {
    return (<form className="search-wrapper">
      <label htmlFor="search-input" className="search-label">
        <span className="sr-only"><FormattedMessage id="search_web_placeholder" /></span>
      </label>
      <input
        id="search-input"
        maxLength="256"
        onChange={this.onChange}
        placeholder={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        title={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        type="search"
        value={this.state.searchString} />
        <button
          className="search-button"
          onClick={this.onClick}
          title={this.props.intl.formatMessage({id: "search_button"})}>
          <span className="sr-only"><FormattedMessage id="search_button" /></span>
        </button>
    </form>);
  }
}

module.exports = connect(state => ({Search: state.Search}))(injectIntl(Search));
module.exports._unconnected = Search;
