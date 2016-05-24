const React = require("react");

const Search = React.createClass({
  getDefaultProps() {
    return {
      onSearch: function() {}
    };
  },
  doSearch(value) {
    this.props.onSearch(value);
  },
  render() {
    return (<form className="search-wrapper">
      <span className="search-label" />
      <input ref="input" type="search" placeholder="Search the Web" />
      <button ref="button" onClick={() => this.doSearch(this.refs.input.value)}>
        <span className="sr-only">Search</span>
      </button>
    </form>);
  }
});

Search.propTypes = {
  onSearch: React.PropTypes.func
};

module.exports = Search;
