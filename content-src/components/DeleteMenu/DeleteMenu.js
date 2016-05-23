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
  onDeleteHistory() {
    this.props.dispatch(actions.NotifyHistoryDelete(this.props.url));
    this.userEvent("DELETE");
  },
  onDeleteBookmark() {
    this.props.dispatch(actions.NotifyBookmarkDelete(this.props.bookmarkGuid));
    this.userEvent("BOOKMARK_DELETE");
  },
  onBlock(url, index) {
    this.props.dispatch(actions.NotifyBlockURL(this.props.url));
    this.userEvent("BLOCK");
  },
  render() {
    const menuOptions = [];

    // Add the correct remove option for either a bookmark or a history link
    if (this.props.bookmarkGuid) {
      menuOptions.push({label: "Remove from Bookmarks", onClick: this.onDeleteBookmark});
    } else {
      menuOptions.push({label: "Remove from History", onClick: this.onDeleteHistory});
    }

    menuOptions.push({label: "Never show on this page", onClick: this.onBlock});

    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      options={menuOptions} />);
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
