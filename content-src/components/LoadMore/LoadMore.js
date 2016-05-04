const React = require("react");
const Loader = require("components/Loader/Loader");
const {Link} = require("react-router");

const LoadMore = React.createClass({
  getDefaultProps() {
    return {
      label: "See more"
    };
  },
  render() {
    const link = this.props.to ?
      (<Link to={this.props.to}><span className="arrow" /> {this.props.label}</Link>) :
      (<a href="#" onClick={e => { e.preventDefault(); this.props.onClick(); }}>
          <span className="arrow" /> {this.props.label}
        </a>);
    return (<div className="load-more" hidden={this.props.hidden}>
      <Loader ref="loader" show={this.props.loading} />
      <p ref="action" hidden={this.props.loading}>
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
