const React = require("react");
const classNames = require("classnames");

const Loader = React.createClass({
  getDefaultProps() {
    return {
      show: false,
      label: "Loading..."
    };
  },
  render() {
    // refs are intended as testing hooks
    return (
      <div className={classNames("loader", this.props.className)} hidden={!this.props.show}>
        <h3 ref="title">{this.props.title}</h3>
        <p ref="body">{this.props.body}</p>
        <div ref="statusBox" className="status-box">
          <div className="spinner" />
          {this.props.label}
        </div>
      </div>);
  }
});

Loader.propTypes = {
  body: React.PropTypes.string,
  show: React.PropTypes.bool,
  label: React.PropTypes.string,
  className: React.PropTypes.string,
  title: React.PropTypes.string
};

module.exports = Loader;
module.exports.Loader = Loader;
