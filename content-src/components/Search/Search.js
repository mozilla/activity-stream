const React = require("react");

const Search = React.createClass({
  getDefaultProps() {
    return {
      onSearch: function() {}
    };
  },
  doSearch(value) {
    if (!value) {
      return;
    }
    this.props.onSearch(value);
  },
  render() {
    return (<form className="search-wrapper">
      <span className="search-label" />
      <input ref="input" type="search" placeholder="Search" required />
      <button ref="button" onClick={() => this.doSearch(this.refs.input.value)}>
        <span />
      </button>
    </form>);
  }
});

Search.propTypes = {
  onSearch: React.PropTypes.func
};

module.exports = Search;
