const React = require("react");
const {injectIntl} = require("react-intl");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");
const {actionCreators: ac} = require("common/Actions.jsm");
const linkMenuOptions = require("content-src/lib/link-menu-options");
const DEFAULT_SITE_MENU_OPTIONS = ["CheckPinTopSite", "Separator", "OpenInNewWindow", "OpenInPrivateWindow"];

class LinkMenu extends React.Component {
  getOptions() {
    const props = this.props;
    const {site, index, source} = props;

    // Handle special case of default site
    const propOptions = !site.isDefault ? props.options : DEFAULT_SITE_MENU_OPTIONS;

    const options = propOptions.map(o => linkMenuOptions[o](site, index)).map(option => {
      const {action, id, type, userEvent} = option;
      if (!type && id) {
        option.label = props.intl.formatMessage(option);
        option.onClick = () => {
          props.dispatch(action);
          if (userEvent) {
            props.dispatch(ac.UserEvent({
              event: userEvent,
              source,
              action_position: index
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
