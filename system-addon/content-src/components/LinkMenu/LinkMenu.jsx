const React = require("react");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

class LinkMenu extends React.Component {
  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
  }
  getOptions() {
    return [
      {
        label: "Bookmark",
        icon: "bookmark"
      },
      {type: "separator"},
      {
        label: "Open in a New Window",
        icon: "new-window"
      },
      {
        label: "Open in a New Private Window",
        icon: "new-window-private"
      },
      {type: "separator"},
      {
        label: "Dismiss",
        icon: "dismiss"
      },
      {
        label: "Delete from History",
        icon: "delete"
      }];
  }
  getOptionsLength() {
    // this is used for a11y - in order to be able to tab through the context menu
    // we don't want to tab over 'separators', so we filter those out
    return this.getOptions().filter(item => item.type !== "separator").length;
  }
  render() {
    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      options={this.getOptions()}
      tabbableOptionsLength={this.getOptionsLength()} />);
  }
}

module.exports = LinkMenu;
