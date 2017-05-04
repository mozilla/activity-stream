const React = require("react");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

class LinkMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {visible: false};
    this.getOptions = this.getOptions.bind(this);
  }
  getOptions() {
    const items = [
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
    const itemLength = items.filter(item => item.type !== "separator").length;
    return {items, itemLength};
  }
  render() {
    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      options={this.getOptions()} />);
  }
}

module.exports = LinkMenu;
