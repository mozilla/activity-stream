const React = require("react");
const {injectIntl} = require("react-intl");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

class LinkMenu extends React.Component {
  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
  }
  getOptions() {
    return [
      {
        id: "menu_action_bookmark",
        icon: "bookmark"
      },
      {type: "separator"},
      {
        id: "menu_action_open_new_window",
        icon: "new-window"
      },
      {
        id: "menu_action_open_private_window",
        icon: "new-window-private"
      },
      {type: "separator"},
      {
        id: "menu_action_dismiss",
        icon: "dismiss"
      },
      {
        id: "menu_action_delete",
        icon: "delete"
      }].map(option => {
        // Convert message ids to localized labels
        option.label = option.id ? this.props.intl.formatMessage(option) : "";
        return option;
      });
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

module.exports = injectIntl(LinkMenu);
module.exports._unconnected = LinkMenu;
