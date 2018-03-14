import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";

/**
 * List of functions that return items that can be included as menu options in a
 * SectionMenu. All functions take the section as the only parameter.
 */
export const SectionMenuOptions = {
  Separator: () => ({type: "separator"}),
  MoveUp: section => ({
    id: "section_menu_action_move_up",
    icon: "arrowhead-up",
    action: ac.OnlyToMain({
      type: at.SECTION_MOVE,
      data: {id: section.id, direction: -1}
    }),
    userEvent: "SECTION_MENU_MOVE_UP",
    disabled: !!section.isFirst
  }),
  MoveDown: section => ({
    id: "section_menu_action_move_down",
    icon: "arrowhead-down",
    action: ac.OnlyToMain({
      type: at.SECTION_MOVE,
      data: {id: section.id, direction: +1}
    }),
    userEvent: "SECTION_MENU_MOVE_DOWN",
    disabled: !!section.isLast
  }),
  RemoveSection: section => ({
    id: "section_menu_action_remove_section",
    icon: "dismiss",
    action: ac.SetPref(section.showPrefName, false),
    userEvent: "SECTION_MENU_REMOVE"
  }),
  CollapseSection: section => ({
    id: "section_menu_action_collapse_section",
    icon: "minimize",
    action: ac.OnlyToMain({type: at.COLLAPSE_SECTION, data: {id: section.id, value: {collapsed: true}}}),
    userEvent: "SECTION_MENU_COLLAPSE"
  }),
  ExpandSection: section => ({
    id: "section_menu_action_expand_section",
    icon: "maximize",
    action: ac.OnlyToMain({type: at.COLLAPSE_SECTION, data: {id: section.id, value: {collapsed: false}}}),
    userEvent: "SECTION_MENU_EXPAND"
  }),
  ManageSection: section => ({
    id: "section_menu_action_manage_section",
    icon: "settings",
    action: ac.OnlyToMain({type: at.SETTINGS_OPEN}),
    userEvent: "SECTION_MENU_MANAGE"
  }),
  AddTopSite: section => ({
    id: "section_menu_action_add_topsite",
    icon: "add",
    action: {type: at.TOP_SITES_EDIT, data: {index: -1}},
    userEvent: "SECTION_MENU_ADD_TOPSITE"
  }),
  PrivacyNotice: section => ({
    id: "section_menu_action_privacy_notice",
    icon: "info",
    action: ac.OnlyToMain({
      type: at.OPEN_LINK,
      data: {url: section.privacyNoticeURL}
    }),
    userEvent: "SECTION_MENU_PRIVACY_NOTICE"
  }),
  CheckCollapsed: section => (section.collapsed ? SectionMenuOptions.ExpandSection(section) : SectionMenuOptions.CollapseSection(section))
};
