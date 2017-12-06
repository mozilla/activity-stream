import {actionCreators as ac} from "common/Actions.jsm";
import {ContextMenu} from "content-src/components/ContextMenu/ContextMenu";
import {injectIntl} from "react-intl";
import {LinkMenuOptions} from "content-src/lib/link-menu-options";
import React from "react";

const DEFAULT_SITE_MENU_OPTIONS = ["CheckPinTopSite", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl"];

export class _LinkMenu extends React.PureComponent {
  getOptions() {
    const props = this.props;
    const {site, index, source} = props;

    // Handle special case of default site
    const propOptions = !site.isDefault ? props.options : DEFAULT_SITE_MENU_OPTIONS;

    const options = propOptions.map(o => LinkMenuOptions[o](site, index, source)).map(option => {
      const {action, impression, id, type, userEvent} = option;
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
          if (impression && props.shouldSendImpressionStats) {
            props.dispatch(impression);
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

export const LinkMenu = injectIntl(_LinkMenu);
