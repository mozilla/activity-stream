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
    const {page, source, index, Experiments, dispatch} = this.props;
    if (page && source) {
      let payload = {
        event,
        page: page,
        source: source,
        action_position: index
      };
      if (["BLOCK", "DELETE"].includes(event) && Experiments.data.reverseMenuOptions) {
        payload.experiment_id = Experiments.data.id;
      }
      dispatch(actions.NotifyEvent(payload));
    }
  },
  getOptions() {
    const {site, allowBlock, Experiments, dispatch} = this.props;
    const isNotDefault = site.type !== FIRST_RUN_TYPE;

    // Don't add delete options for default links
    // that show up if your history is empty
    const deleteOptions = isNotDefault ? [
      {type: "separator"},
      allowBlock && {
        ref: "dismiss",
        label: "Dismiss",
        userEvent: "BLOCK",
        onClick: () => dispatch(actions.NotifyBlockURL(site.url))
      },
      {
        ref: "delete",
        label: "Delete from History",
        userEvent: "DELETE",
        onClick: () => dispatch(actions.NotifyHistoryDelete(site.url))
      }
    ] : [];

    if (Experiments.data.reverseMenuOptions) {
      deleteOptions.reverse();
    }

    return [
      (site.bookmarkGuid ? {
        ref: "removeBookmark",
        label: "Remove Bookmark",
        userEvent: "BOOKMARK_DELETE",
        onClick: () => dispatch(actions.NotifyBookmarkDelete(site.bookmarkGuid))
      } : {
        ref: "addBookmark",
        label: "Bookmark",
        userEvent: "BOOKMARK_ADD",
        onClick: () => dispatch(actions.NotifyBookmarkAdd(site.url))
      }),
      {type: "separator"},
      {
        ref: "openWindow",
        label: "Open in a New Window",
        userEvent: "OPEN_NEW_WINDOW",
        onClick: () => dispatch(actions.NotifyOpenWindow({url: site.url}))
      },
      {
        ref: "openPrivate",
        label: "Open in a Private Window",
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
    bookmarkGuid: React.PropTypes.string
  }).isRequired,

  // This is for events
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number
};

module.exports = connect(({Experiments}) => ({Experiments}))(LinkMenu);
