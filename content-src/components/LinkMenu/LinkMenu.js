const React = require("react");
const {connect} = require("react-redux");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {actions} = require("common/action-manager");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

const LinkMenu = React.createClass({
  getDefaultProps() {
    return {
      visible: false,
      allowBlock: true
    };
  },
  userEvent(event) {
    const {page, source, index, dispatch} = this.props;
    if (page && source) {
      let payload = {
        event,
        page: page,
        source: source,
        action_position: index
      };
      dispatch(actions.NotifyEvent(payload));
    }
  },
  getOptions() {
    const {site, allowBlock, reverseMenuOptions, dispatch, page} = this.props;
    const isNotDefault = site.type !== FIRST_RUN_TYPE;

    let deleteOptions;

    // Don't add delete options for default links
    // that show up if your history is empty
    if (isNotDefault && page !== "TIMELINE_BOOKMARKS") {
      deleteOptions = [
        allowBlock && {
          ref: "dismiss",
          label: "Dismiss",
          icon: "dismiss",
          userEvent: "BLOCK",
          onClick: () => {
            if (site.recommended) {
              dispatch(actions.NotifyBlockRecommendation(site.url));
              dispatch(actions.RequestHighlightsLinks());
            } else {
              dispatch(actions.NotifyBlockURL(site.url));
            }
          }
        },
        !site.recommended && {
          ref: "delete",
          label: "Delete from History",
          icon: "delete",
          userEvent: "DELETE",
          onClick: () => dispatch(actions.NotifyHistoryDelete(site.url))
        }
      ];

      if (reverseMenuOptions) {
        deleteOptions.reverse();
      }

      deleteOptions.unshift({type: "separator"});
    }

    return [
      (site.bookmarkGuid ? {
        ref: "removeBookmark",
        label: "Remove Bookmark",
        icon: "bookmark-remove",
        userEvent: "BOOKMARK_DELETE",
        onClick: () => dispatch(actions.NotifyBookmarkDelete(site.bookmarkGuid))
      } : {
        ref: "addBookmark",
        label: "Bookmark",
        icon: "bookmark",
        userEvent: "BOOKMARK_ADD",
        onClick: () => dispatch(actions.NotifyBookmarkAdd(site.url))
      }),
      {type: "separator"},
      {
        ref: "openWindow",
        label: "Open in a New Window",
        icon: "new-window",
        userEvent: "OPEN_NEW_WINDOW",
        onClick: () => dispatch(actions.NotifyOpenWindow({url: site.url}))
      },
      {
        ref: "openPrivate",
        label: "Open in a Private Window",
        icon: "new-window-private",
        userEvent: "OPEN_PRIVATE_WINDOW",
        onClick: () => dispatch(actions.NotifyOpenWindow({url: site.url, isPrivate: true}))
      }]
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
  site: React.PropTypes.shape({
    url: React.PropTypes.string.isRequired,
    bookmarkGuid: React.PropTypes.string,
    recommended: React.PropTypes.bool
  }).isRequired,

  // This is for events
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number
};

module.exports = connect(({Experiments}) => {
  return {
    reverseMenuOptions: Experiments.values.reverseMenuOptions
  };
})(LinkMenu);
