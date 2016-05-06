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
    return (<div className={classNames("loader", this.props.className, {centered: this.props.centered})} hidden={!this.props.show}>
      <div className="spinner"/> {this.props.label}
    </div>);
  }
});

Loader.propTypes = {
  show: React.PropTypes.bool,
  label: React.PropTypes.string,
  className: React.PropTypes.string,
  centered: React.PropTypes.bool
};

module.exports = Loader;
