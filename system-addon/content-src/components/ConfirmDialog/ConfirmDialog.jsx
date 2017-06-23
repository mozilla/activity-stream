const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const {actionTypes, actionCreators: ac} = require("common/Actions.jsm");

/**
 * ConfirmDialog component.
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
const ConfirmDialog = React.createClass({
  getDefaultProps() {
    return {
      visible: false,
      data: {}
    };
  },

  _handleCancelBtn() {
    this.props.dispatch({type: actionTypes.DIALOG_CANCEL});
    this.props.dispatch(ac.UserEvent({event: actionTypes.DIALOG_CANCEL}));
  },

  _handleConfirmBtn() {
    this.props.data.onConfirm.forEach(this.props.dispatch);
  },

  _renderModalMessage() {
    const message_body = this.props.data.body_string_id;

    if (!message_body) {
      return null;
    }

    return (<span>
      {message_body.map(msg => <p key={msg}><FormattedMessage id={msg} /></p>)}
    </span>);
  },

  render() {
    if (!this.props.visible) {
      return null;
    }

    return (<div className="confirmation-dialog">
      <div className="modal-overlay" onClick={this._handleCancelBtn} />
      <div className="modal" ref="modal">
        <section className="modal-message">
          {this._renderModalMessage()}
        </section>
        <section className="actions">
          <button ref="cancelButton" onClick={this._handleCancelBtn}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          <button ref="confirmButton" className="done" onClick={this._handleConfirmBtn}>
            <FormattedMessage id={this.props.data.confirm_button_string_id} />
          </button>
        </section>
      </div>
    </div>);
  }
});

module.exports = connect(state => state.Dialog)(ConfirmDialog);
module.exports._unconnected = ConfirmDialog;
module.exports.Dialog = ConfirmDialog;
