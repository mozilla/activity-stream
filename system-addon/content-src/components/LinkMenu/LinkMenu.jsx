const React = require("react");
const {injectIntl} = require("react-intl");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");
const {actionTypes, actionCreators} = require("common/Actions.jsm");

class LinkMenu extends React.Component {
  getBookmarkStatus(site) {
    return (site.bookmarkGuid ? {
      id: "menu_action_remove_bookmark",
      icon: "bookmark-remove",
      action: "DELETE_BOOKMARK_BY_ID",
      data: site.bookmarkGuid
    } : {
      id: "menu_action_bookmark",
      icon: "bookmark",
      action: "BOOKMARK_URL",
      data: site.url
    });
  }
  getDefaultContextMenu(site) {
    return [{
      id: "menu_action_open_new_window",
      icon: "new-window",
      action: "OPEN_NEW_WINDOW",
      data: {url: site.url}
    },
    {
      id: "menu_action_open_private_window",
      icon: "new-window-private",
      action: "OPEN_PRIVATE_WINDOW",
      data: {url: site.url}
    }];
  }
  getOptions() {
    const {dispatch, site} = this.props;

    // default top sites have a limited set of context menu options
    let options = this.getDefaultContextMenu(site);

    // all other top sites have all the following context menu options
    if (!site.isDefault) {
      options = [
        this.getBookmarkStatus(site),
        {type: "separator"},
        ...options,
        {type: "separator"},
        {
          id: "menu_action_dismiss",
          icon: "dismiss",
          action: "BLOCK_URL",
          data: site.url
        },
        {
          id: "menu_action_delete",
          icon: "delete",
          action: "DELETE_HISTORY_URL",
          data: site.url
        }];
    }
    options.forEach(option => {
      let {action, data, id, type} = option;
      // Convert message ids to localized labels and add onClick function
      if (!type && id) {
        option.label = this.props.intl.formatMessage(option);
        option.onClick = () => (dispatch(actionCreators.SendToMain({type: actionTypes[action], data})));
      }
    });

    // this is for a11y - we want to know which item is the first and which item
    // is the last, so we can close the context menu accordingly
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
