const React = require("react");
const {connect} = require("react-redux");
const {selectShareProviders} = require("common/selectors/selectors");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {actions} = require("common/action-manager");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

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
      if (site.recommended) {
        payload.url = site.url;
        payload.recommender_type = site.recommender_type;
      }
      dispatch(actions.NotifyEvent(payload));
    }
  },
  getSocialShareOptions(site, providers, dispatch) {
    if (providers.length === 0) {
      return [];
    }

    let options = [{type: "separator"}];

    for (let provider of providers) {
      let _provider = provider;
      options.push({
        ref: `share${provider.name}`,
        label: provider.name,
        iconURL: provider.iconURL,
        onClick: () => dispatch(actions.NotifyShareUrl(site.url, site.title, _provider.origin))
      });
    }

    return options;
  },
  getShareOptions(site, providers, dispatch) {
    return [
      {
        ref: "copyAddress",
        label: "Copy Address",
        icon: "copy-address",
        onClick: () => dispatch(actions.NotifyCopyUrl(site.url))
      },
      {
        ref: "emailLink",
        label: "Email Link...",
        icon: "email-link",
        onClick: () => dispatch(actions.NotifyEmailUrl(site.url, site.title))
      }]
      .concat(this.getSocialShareOptions(site, providers, dispatch));
  },
  getOptions() {
    const {site, allowBlock, reverseMenuOptions, dispatch, ShareProviders} = this.props;
    const isNotDefault = site.type !== FIRST_RUN_TYPE;

    let deleteOptions;

    // Don't add delete options for default links
    // that show up if your history is empty
    if (isNotDefault) {
      deleteOptions = [
        allowBlock && {
          ref: "dismiss",
          label: "Dismiss",
          icon: "dismiss",
          userEvent: "BLOCK",
          onClick: () => {
            dispatch(actions.NotifyBlockURL(site.url));
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
      {
        type: "submenu",
        ref: "share",
        label: "Share",
        icon: "share",
        options: this.getShareOptions(site, ShareProviders ? ShareProviders.providers : [], dispatch)
      },
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

  ShareProviders: React.PropTypes.object,

  // This is for events
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string,
  recommender_type: React.PropTypes.string
};

module.exports = connect(selectShareProviders)(LinkMenu);
