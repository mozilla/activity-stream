const React = require("react");
const classNames = require("classnames");
const {FormattedMessage} = require("react-intl");

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
      <div ref="loader" className={classNames("loader", this.props.className)} hidden={!this.props.show}>
        <h3 ref="title"><FormattedMessage id={this.props.title} defaultMessage={this.props.title} /></h3>
        <p ref="body"><FormattedMessage id={this.props.body} defaultMessage={this.props.body} /></p>
        <div ref="statusBox" className="status-box">
          <div className="spinner" />
          <FormattedMessage id={this.props.label} defaultMessage={this.props.label} />
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
