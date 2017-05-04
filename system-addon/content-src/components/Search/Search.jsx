"use strict";
const React = require("react");
const {connect} = require("react-redux");
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
      <label htmlFor="search-input" className="search-label"><span className="sr-only">Search The Web</span></label>
      <input id="search-input" value={this.state.searchString} type="search"
        title="Search The Web"
        onChange={this.onChange}
        maxLength="256"
        placeholder="Search the Web" />
        <button className="search-button" title="Submit search" onClick={this.onClick} />
    </form>);
  }
}

module.exports = connect(state => ({Search: state.Search}))(Search);
module.exports._unconnected = Search;
