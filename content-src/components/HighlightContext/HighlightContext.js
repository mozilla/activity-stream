const React = require("react");
const highlightTypes = require("./types");
const Tooltip = require("components/Tooltip/Tooltip");
const getRelativeTime = require("lib/getRelativeTime");

const HighlightContext = React.createClass({
  render() {
    let timestamp;
    const type = this.props.type;
    const {icon, label, showTimestamp, tooltip} = Object.assign({}, highlightTypes[type], this.props);
    if (this.props.date && showTimestamp !== false) {
      timestamp = getRelativeTime(this.props.date);
    }
    return (<div className="highlight-context tooltip-container">
      <span className="hc-icon">
        <span ref="icon" className={`icon icon-${icon}`} /><span className="sr-only">{this.props.type}</span>
      </span>
      <span ref="label" className="hc-label">{label}</span>
      <span hidden={!timestamp} ref="timestamp" className="hc-timestamp">{timestamp}</span>
      {tooltip && <Tooltip ref="tooltip" label={tooltip} />}
    </div>);
  }
});

HighlightContext.propTypes = {
  type: React.PropTypes.oneOf(Object.keys(highlightTypes)),
  label: React.PropTypes.string,
  date: React.PropTypes.number
};

/**
 * Only display a placeholder version (ie just outlines/shapes), for use
 * before sufficient data is available to display.
 *
 * This should be a stateless, functional component.  Unfortunately, testing
 * these kinda sucks; see
 * http://stackoverflow.com/questions/36682241/testing-functional-components-with-renderintodocument)
 *
 * The bottom line: we should start using Enzyme and switch this over.
 */
const PlaceholderHighlightContext = React.createClass({
  render() {
    return (
      <div className="highlight-context placeholder">
        <div className="hc-icon">
          <div className="icon" />
        </div>
        <div className="hc-label" />
      </div>
    );
  }
});

module.exports = {
  HighlightContext,
  PlaceholderHighlightContext,
  types: highlightTypes
};
