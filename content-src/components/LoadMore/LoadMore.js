const React = require("react");
const Loader = require("components/Loader/Loader");
const {Link} = require("react-router");
const {l10n} = require("lib/utils");

const LoadMore = React.createClass({
  getDefaultProps() {
    return {
      "data-l10n-id": "load-more-label",
      label: "See more"
    };
  },
  render() {
    const link = this.props.to ?
      (<Link to={this.props.to} {...l10n(this.props)}><span className="fa fa-chevron-down" /> {this.props.label}</Link>) :
      (<a href="#" onClick={e => { e.preventDefault(); this.props.onClick(); }} {...l10n(this.props)}>
          <span className="fa fa-chevron-down" /> {this.props.label}
        </a>);
    return (<div hidden={this.props.hidden}>
      <Loader ref="loader" show={this.props.loading} />
      <p ref="action" className="load-more" hidden={this.props.loading}>
        {link}
      </p>
    </div>);
  }
});

LoadMore.propTypes = {
  to: React.PropTypes.string,
  onClick: React.PropTypes.func,
  hidden: React.PropTypes.bool,
  loading: React.PropTypes.bool
};

module.exports = LoadMore;
