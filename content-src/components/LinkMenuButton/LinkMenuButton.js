const React = require("react");

const LinkMenuButton = React.createClass({
  render() {
    return (<button className="link-menu-button" onClick={e => {e.preventDefault(); this.props.onClick(e);}}>
      <span className="sr-only">Open context menu</span>
    </button>);
  }
});

LinkMenuButton.propTypes = {onClick: React.PropTypes.func.isRequired};

module.exports = LinkMenuButton;
