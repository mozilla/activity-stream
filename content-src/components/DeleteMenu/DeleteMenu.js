const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const ContextMenu = require("components/ContextMenu/ContextMenu");

const DeleteMenu = React.createClass({
  userEvent(event) {
    if (this.props.page && this.props.source) {
      this.props.dispatch(actions.NotifyEvent({
        event,
        page: this.props.page,
        source: this.props.source,
        action_position: this.props.index
      }));
    }
  },
  onDelete() {
    this.props.dispatch(actions.NotifyHistoryDelete(this.props.url));
    this.userEvent("DELETE");
  },
  onBlock(url, index) {
    this.props.dispatch(actions.BlockUrl(this.props.url));
    this.userEvent("BLOCK");
  },
  render() {
    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      options={[
        {label: "Remove from History", onClick: this.onDelete},
        {label: "Never show this page", onClick: this.onBlock}
      ]} />);
  }
});

DeleteMenu.propTypes = {
  visible: React.PropTypes.bool,
  onUpdate: React.PropTypes.func.isRequired,
  url: React.PropTypes.string.isRequired,

  // For user event tracking
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number
};

module.exports = connect(justDispatch)(DeleteMenu);
