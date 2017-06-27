const React = require("react");
const {injectIntl} = require("react-intl");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

const RemoveBookmark = site => ({
  id: "menu_action_remove_bookmark",
  icon: "bookmark-remove",
  action: ac.SendToMain({
    type: at.DELETE_BOOKMARK_BY_ID,
    data: site.bookmarkGuid
  }),
  userEvent: "BOOKMARK_DELETE"
});

const AddBookmark = site => ({
  id: "menu_action_bookmark",
  icon: "bookmark",
  action: ac.SendToMain({
    type: at.BOOKMARK_URL,
    data: site.url
  }),
  userEvent: "BOOKMARK_ADD"
});

const OpenInNewWindow = site => ({
  id: "menu_action_open_new_window",
  icon: "new-window",
  action: ac.SendToMain({
    type: at.OPEN_NEW_WINDOW,
    data: {url: site.url}
  }),
  userEvent: "OPEN_NEW_WINDOW"
});

const OpenInPrivateWindow = site => ({
  id: "menu_action_open_private_window",
  icon: "new-window-private",
  action: ac.SendToMain({
    type: at.OPEN_PRIVATE_WINDOW,
    data: {url: site.url}
  }),
  userEvent: "OPEN_PRIVATE_WINDOW"
});

const BlockUrl = site => ({
  id: "menu_action_dismiss",
  icon: "dismiss",
  action: ac.SendToMain({
    type: at.BLOCK_URL,
    data: site.url
  }),
  userEvent: "BLOCK"
});

const DeleteUrl = site => ({
  id: "menu_action_delete",
  icon: "delete",
  action: {
    type: at.DIALOG_OPEN,
    data: {
      onConfirm: [
        ac.SendToMain({type: at.DELETE_HISTORY_URL, data: site.url}),
        ac.UserEvent({event: "DELETE"})
      ],
      body_string_id: ["confirm_history_delete_p1", "confirm_history_delete_notice_p2"],
      confirm_button_string_id: "menu_action_delete"
    }
  },
  userEvent: "DIALOG_OPEN"
});

class LinkMenu extends React.Component {
  getOptions() {
    const props = this.props;
    const {site} = props;
    const isBookmark = site.bookmarkGuid;
    const isDefault = site.isDefault;

    const options = [

      // Bookmarks
      !isDefault && (isBookmark ? RemoveBookmark(site) : AddBookmark(site)),
      !isDefault && {type: "separator"},

      // Menu items for all sites
      OpenInNewWindow(site),
      OpenInPrivateWindow(site),

      // Blocking and deleting
      !isDefault && {type: "separator"},
      !isDefault && BlockUrl(site),
      !isDefault && DeleteUrl(site)

    ].filter(o => o).map(option => {
      const {action, id, type, userEvent} = option;
      if (!type && id) {
        option.label = props.intl.formatMessage(option);
        option.onClick = () => {
          props.dispatch(action);
          if (userEvent) {
            props.dispatch(ac.UserEvent({
              event: userEvent,
              source: props.source,
              action_position: props.index
            }));
          }
        };
      }
      return option;
    });

    // This is for accessibility to support making each item tabbable.
    // We want to know which item is the first and which item
    // is the last, so we can close the context menu accordingly.
    options[0].first = true;
    options[options.length - 1].last = true;
    return options;
  }
  render() {
    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      options={this.getOptions()} />);
  }
}

module.exports = injectIntl(LinkMenu);
module.exports._unconnected = LinkMenu;
