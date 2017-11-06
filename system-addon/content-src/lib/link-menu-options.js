const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

/**
 * List of functions that return items that can be included as menu options in a
 * LinkMenu. All functions take the site as the first parameter, and optionally
 * the index of the site.
 */
module.exports = {
  Separator: () => ({type: "separator"}),
  RemoveBookmark: site => ({
    id: "menu_action_remove_bookmark",
    icon: "bookmark-added",
    action: ac.SendToMain({
      type: at.DELETE_BOOKMARK_BY_ID,
      data: site.bookmarkGuid
    }),
    userEvent: "BOOKMARK_DELETE"
  }),
  AddBookmark: site => ({
    id: "menu_action_bookmark",
    icon: "bookmark-hollow",
    action: ac.SendToMain({
      type: at.BOOKMARK_URL,
      data: {url: site.url, title: site.title, type: site.type}
    }),
    userEvent: "BOOKMARK_ADD"
  }),
  OpenInNewWindow: site => ({
    id: "menu_action_open_new_window",
    icon: "new-window",
    action: ac.SendToMain({
      type: at.OPEN_NEW_WINDOW,
      data: {url: site.url, referrer: site.referrer}
    }),
    userEvent: "OPEN_NEW_WINDOW"
  }),
  OpenInPrivateWindow: site => ({
    id: "menu_action_open_private_window",
    icon: "new-window-private",
    action: ac.SendToMain({
      type: at.OPEN_PRIVATE_WINDOW,
      data: {url: site.url, referrer: site.referrer}
    }),
    userEvent: "OPEN_PRIVATE_WINDOW"
  }),
  BlockUrl: (site, index, eventSource) => ({
    id: "menu_action_dismiss",
    icon: "dismiss",
    action: ac.SendToMain({
      type: at.BLOCK_URL,
      data: site.url
    }),
    impression: ac.ImpressionStats({
      source: eventSource,
      block: 0,
      tiles: [{id: site.guid, pos: index}]
    }),
    userEvent: "BLOCK"
  }),
  DeleteUrl: site => ({
    id: "menu_action_delete",
    icon: "delete",
    action: {
      type: at.DIALOG_OPEN,
      data: {
        onConfirm: [
          ac.SendToMain({type: at.DELETE_HISTORY_URL, data: {url: site.url, forceBlock: site.bookmarkGuid}}),
          ac.UserEvent({event: "DELETE"})
        ],
        body_string_id: ["confirm_history_delete_p1", "confirm_history_delete_notice_p2"],
        confirm_button_string_id: "menu_action_delete",
        cancel_button_string_id: "topsites_form_cancel_button",
        icon: "modal-delete"
      }
    },
    userEvent: "DIALOG_OPEN"
  }),
  PinTopSite: (site, index) => ({
    id: "menu_action_pin",
    icon: "pin",
    action: ac.SendToMain({
      type: at.TOP_SITES_PIN,
      data: {site: {url: site.url}, index}
    }),
    userEvent: "PIN"
  }),
  UnpinTopSite: site => ({
    id: "menu_action_unpin",
    icon: "unpin",
    action: ac.SendToMain({
      type: at.TOP_SITES_UNPIN,
      data: {site: {url: site.url}}
    }),
    userEvent: "UNPIN"
  }),
  SaveToPocket: (site, index, eventSource) => ({
    id: "menu_action_save_to_pocket",
    icon: "pocket",
    action: ac.SendToMain({
      type: at.SAVE_TO_POCKET,
      data: {site: {url: site.url, title: site.title}}
    }),
    impression: ac.ImpressionStats({
      source: eventSource,
      pocket: 0,
      tiles: [{id: site.guid, pos: index}]
    }),
    userEvent: "SAVE_TO_POCKET"
  }),
  EditTopSite: site => ({
    id: "edit_topsites_button_text",
    icon: "edit",
    action: {
      type: at.TOP_SITES_EDIT,
      data: {url: site.url, label: site.label}
    }
  })
};

module.exports.CheckBookmark = site => (site.bookmarkGuid ? module.exports.RemoveBookmark(site) : module.exports.AddBookmark(site));
module.exports.CheckPinTopSite = (site, index) => (site.isPinned ? module.exports.UnpinTopSite(site) : module.exports.PinTopSite(site, index));
