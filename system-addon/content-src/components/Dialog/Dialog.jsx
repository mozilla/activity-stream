const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const {actionTypes, actionCreators: ac} = require("common/Actions.jsm");

/**
 * Confirmation Dialog component.
 * One primary action button, one cancel button.
 *
 * Content displayed is controlled by `data` prop the component receives.
 * Example:
 * data: {
 *   // Any sort of data needed to be passed around by actions.
 *   payload: site.url,
 *   // Primary button SendToMain action.
 *   action: "DELETE_HISTORY_URL",
 *   // Primary button USerEvent action.
 *   userEvent: "DELETE",
 *   // Array of locale ids to display.
 *   message_body: ["confirm_history_delete", "confirm_history_delete_notice"],
 *   // Text for primary button.
 *   confirm_btn_id: "menu_action_delete"
 * },
 */
const Dialog = React.createClass({
  getDefaultProps() {
    return {
      visible: false,
      data: {}
    };
  },

  _handleCancelBtn() {
    this.props.dispatch(ac.SendToMain({type: actionTypes.DIALOG_CANCEL}));
    this.props.dispatch(ac.UserEvent({event: actionTypes.DIALOG_CANCEL}));
  },

  _handleConfirmBtn() {
    const data = this.props.Dialog.data;
    this.props.dispatch(ac.SendToMain({type: actionTypes[data.action], data: data.payload}));
    this.props.dispatch(ac.UserEvent({event: data.userEvent}));
  },

  _renderModalMessage() {
    const message_body = this.props.Dialog.data.message_body;

    if (!message_body) {
      return null;
    }

    return (<span>
      {message_body.map(msg => <p key={msg}><FormattedMessage id={msg} /></p>)}
    </span>);
  },

  render() {
    const props = this.props.Dialog;

    if (!props.visible) {
      return null;
    }

    return (<div className="confirmation-dialog">
      <div className="modal-overlay" />
      <div className="modal" ref="modal">
        <section className="modal-message">
          {this._renderModalMessage()}
        </section>
        <section className="actions">
          <button ref="cancelButton" onClick={this._handleCancelBtn}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          <button ref="confirmButton" className="done" onClick={this._handleConfirmBtn}>
            <FormattedMessage id={props.data.confirm_btn_id} />
          </button>
        </section>
      </div>
    </div>);
  }
});

module.exports = connect(state => ({Dialog: state.Dialog}))(Dialog);
module.exports._unconnected = Dialog;
module.exports.Dialog = Dialog;
