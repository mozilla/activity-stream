const React = require("react");

const Loader = React.createClass({
  getDefaultProps() {
    return {
      show: false
    };
  },
  render() {
    return (<div className="loader" hidden={!this.props.show}>
      <div className="spinner"/> Loading...
    </div>);
  }
});

Loader.propTypes = {
  show: React.PropTypes.bool
};

module.exports = Loader;
