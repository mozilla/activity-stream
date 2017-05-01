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
      <span className="search-label" />
      <input value={this.state.searchString} type="search"
        onChange={this.onChange}
        maxLength="256" title="Submit search"
        placeholder="Search the Web" />
        <button onClick={this.onClick} />
        </form>);
  }
}

module.exports = connect(state => ({Search: state.Search}))(Search);
