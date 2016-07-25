const React = require("react");
const moment = require("moment");
const highlightTypes = require("./types");

const HighlightContext = React.createClass({
  render() {
    let timestamp;
    const type = this.props.type;
    const {icon, label, showTimestamp} = Object.assign({}, highlightTypes[type], this.props);
    if (showTimestamp !== false) {
      timestamp = moment(this.props.date).fromNow();
    }
    return (<div className="highlight-context">
      <span className="hc-icon">
        <span className={`icon icon-${icon}`} /><span className="sr-only">{this.props.type}</span>
      </span>
      <span className="hc-label">{label}</span>
      <span className="hc-timestamp">{timestamp}</span>
    </div>);
  }
});

HighlightContext.propTypes = {
  type: React.PropTypes.oneOf(Object.keys(highlightTypes)),
  label: React.PropTypes.string,
  date: React.PropTypes.number
};

module.exports = HighlightContext;
