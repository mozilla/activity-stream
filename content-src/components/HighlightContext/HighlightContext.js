const React = require("react");
const highlightTypes = require("./types");
const Tooltip = require("components/Tooltip/Tooltip");
const getRelativeTime = require("lib/getRelativeTime");
const {FormattedMessage} = require("react-intl");

const HighlightContext = function(props) {
  let timestamp = {};
  let timestampID;
  let timestampNumber;
  const type = props.type;
  const {icon, intlID, showTimestamp, tooltip} = Object.assign({}, highlightTypes[type], props);
  if (props.date && showTimestamp !== false) {
    timestamp = getRelativeTime(props.date);
    timestampID = timestamp.timestampID;
    timestampNumber = timestamp.timestampNumber;
  }
  return (<div className="highlight-context tooltip-container">
    <span className="hc-icon">
      <span className={`icon icon-${icon}`} /><span className="sr-only">{type}</span>
    </span>
    <span className="hc-label"><FormattedMessage id={intlID} defaultMessage="Visited" /></span>
    {timestampID && <span className="hc-timestamp"><FormattedMessage id={timestampID} defaultMessage="0" values={{number: timestampNumber}} /></span>}
    {tooltip && <Tooltip label={tooltip} />}
  </div>);
};

HighlightContext.propTypes = {
  type: React.PropTypes.oneOf(Object.keys(highlightTypes)),
  intlID: React.PropTypes.string,
  date: React.PropTypes.number
};

/**
 * Only display a placeholder version (ie just outlines/shapes), for use
 * before sufficient data is available to display.
 */
const PlaceholderHighlightContext = function() {
  return (
    <div className="highlight-context placeholder">
      <div className="hc-icon">
        <div className="icon" />
      </div>
      <div className="hc-label" />
    </div>
  );
};

module.exports = {
  HighlightContext,
  PlaceholderHighlightContext,
  types: highlightTypes
};
