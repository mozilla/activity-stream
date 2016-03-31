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
      <span className="search-label fa fa-search" />
      <input data-l10n-id="search-input" ref="input" type="search" placeholder="Search" required />
      <button ref="button" onClick={() => this.doSearch(this.refs.input.value)}>
        <span className="fa fa-arrow-right" />
      </button>
    </form>);
  }
});

Search.propTypes = {
  onSearch: React.PropTypes.func
};

module.exports = Search;
