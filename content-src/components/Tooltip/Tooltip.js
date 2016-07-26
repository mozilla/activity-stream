const React = require("react");

const Tooltip = React.createClass({
  render() {
    const style = {};
    if (this.props.visible === true) {
      style.display = "block";
    } else if (this.props.visible === false) {
      style.display = "none";
    }
    return (<div className="tooltip" style={style}>
      {this.props.label}
      <div className="tooltip-tip" />
    </div>);
  }
});

Tooltip.propTypes = {
  label: React.PropTypes.string.isRequired,
  visible: React.PropTypes.bool
};

module.exports = Tooltip;
