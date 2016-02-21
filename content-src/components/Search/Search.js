const React = require("react");

const Search = React.createClass({
  getDefaultProps() {
    return {
      onSearch: function() {}
    };
  },
  render() {
    return (<div className="search-wrapper">
      <span className="search-label fa fa-search" />
      <input ref="input" placeholder="Search" required />
      <button ref="button" onClick={() => this.props.onSearch(this.refs.input.value)}>
        <span className="fa fa-arrow-right" />
      </button>
    </div>);
  }
});

Search.propTypes = {
  onSearch: React.PropTypes.func
};

module.exports = Search;
