const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {actions} = require("common/action-manager");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");
const {injectIntl} = require("react-intl");

const LinkMenu = React.createClass({
  getDefaultProps() {
    return {
      visible: false,
      allowBlock: true,
      site: {}
    };
  },
  userEvent(event) {
    const {page, source, index, dispatch, site} = this.props;
    if (page && source) {
      let payload = {
        event,
        page,
        source,
        action_position: index,
        metadata_source: site.metadata_source
      };
      dispatch(actions.NotifyEvent(payload));
    }
  },
  getOptions() {
    const {site, allowBlock, dispatch, prefs} = this.props;
    const isNotDefault = site.type !== FIRST_RUN_TYPE;

    let deleteOptions;

    // Don't add delete options for default links
    // that show up if your history is empty
    if (isNotDefault) {
      deleteOptions = [
        {type: "separator"},
        allowBlock && {
          ref: "dismiss",
          label: this.props.intl.formatMessage({id: "menu_action_dismiss"}),
          icon: "dismiss",
          userEvent: "BLOCK",
          onClick: () => {
            dispatch(actions.NotifyBlockURL(site.url));
          }
        },
        {
          ref: "delete",
          label: this.props.intl.formatMessage({id: "menu_action_delete"}),
          icon: "delete",
          userEvent: "DELETE",
          onClick: () => dispatch(actions.NotifyHistoryDelete(site.url))
        }
      ];
    }

    let pocketOption = [];
    if (prefs && prefs.showPocket) {
      pocketOption = [
        {
          ref: "saveToPocket",
          label: this.props.intl.formatMessage({id: "menu_action_save_to_pocket"}),
          icon: "pocket",
          userEvent: "SAVE_TO_POCKET",
          onClick: () => dispatch(actions.NotifySaveToPocket(site.url, site.title))
        },
        {type: "separator"}
      ];
    }

    return pocketOption.concat([
      (site.bookmarkGuid ? {
        ref: "removeBookmark",
        label: this.props.intl.formatMessage({id: "menu_action_remove_bookmark"}),
        icon: "bookmark-remove",
        userEvent: "BOOKMARK_DELETE",
        onClick: () => dispatch(actions.NotifyBookmarkDelete(site.bookmarkGuid))
      } : {
        ref: "addBookmark",
        label: this.props.intl.formatMessage({id: "menu_action_bookmark"}),
        icon: "bookmark",
        userEvent: "BOOKMARK_ADD",
        onClick: () => dispatch(actions.NotifyBookmarkAdd(site.url))
      }),
      {type: "separator"},
      {
        ref: "openWindow",
        label: this.props.intl.formatMessage({id: "menu_action_open_new_window"}),
        icon: "new-window",
        userEvent: "OPEN_NEW_WINDOW",
        onClick: () => dispatch(actions.NotifyOpenWindow({url: site.url}))
      },
      {
        ref: "openPrivate",
        label: this.props.intl.formatMessage({id: "menu_action_open_private_window"}),
        icon: "new-window-private",
        userEvent: "OPEN_PRIVATE_WINDOW",
        onClick: () => dispatch(actions.NotifyOpenWindow({url: site.url, isPrivate: true}))
      }])
      .concat(deleteOptions).filter(o => o);
  },
  render() {
    return (<ContextMenu
      visible={this.props.visible}
      onUpdate={this.props.onUpdate}
      onUserEvent={this.userEvent}
      options={this.getOptions()} />);
  }
});

LinkMenu.propTypes = {
  visible: React.PropTypes.bool,
  onUpdate: React.PropTypes.func.isRequired,
  allowBlock: React.PropTypes.bool,
  prefs: React.PropTypes.object,
  site: React.PropTypes.shape({
    url: React.PropTypes.string.isRequired,
    bookmarkGuid: React.PropTypes.string,
    recommended: React.PropTypes.bool
  }).isRequired,

  // This is for events
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string,
  recommender_type: React.PropTypes.string
};

module.exports = connect(justDispatch)(injectIntl(LinkMenu));
