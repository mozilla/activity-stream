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
      <div className="anchor"></div>
    </div>);
  }
});

Tooltip.propTypes = {
  label: React.PropTypes.string.isRequired,
  visible: React.PropTypes.bool
};

module.exports = Tooltip;

// <div className="spotlight-context" ref="spotlightContext"
//   onMouseOver={() => this.onMouseIn(site)}
//   onMouseOut={() => this.onMouseOut(site)}>
//   {site.recommended ? <div className="icon icon-pocket"></div> : null}
//   <div className={site.recommended ? "recommended-context" : ""}
//   ref="contextMessage">{contextMessage}</div>
// </div>
