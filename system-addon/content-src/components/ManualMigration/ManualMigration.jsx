const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

/**
 * Manual migration component used to start the profile import wizard.
 * Message is presented temporarily and will go away if:
 * 1.  User clicks "No Thanks"
 * 2.  User completed the data import
 * 3.  After 3 active days
 * 4.  User clicks "Cancel" on the import wizard (currently not implemented).
 */
class ManualMigration extends React.Component {
  constructor(props) {
    super(props);
    this.onLaunchTour = this.onLaunchTour.bind(this);
    this.onCancelTour = this.onCancelTour.bind(this);
  }
  onLaunchTour() {
    this.props.dispatch(ac.SendToMain({type: at.MIGRATION_START}));
    this.props.dispatch(ac.UserEvent({event: at.MIGRATION_START}));
  }

  onCancelTour() {
    this.props.dispatch(ac.SendToMain({type: at.MIGRATION_CANCEL}));
    this.props.dispatch(ac.UserEvent({event: at.MIGRATION_CANCEL}));
  }

  render() {
    return (<div className="manual-migration-container">
        <p>
          <span className="icon icon-info" />
          <FormattedMessage id="manual_migration_explanation" />
        </p>
        <div className="manual-migration-actions actions">
          <button onClick={this.onCancelTour}>
            <FormattedMessage id="manual_migration_cancel_button" />
          </button>
          <button className="done" onClick={this.onLaunchTour}>
            <FormattedMessage id="manual_migration_import_button" />
          </button>
        </div>
    </div>);
  }
}

module.exports = connect()(ManualMigration);
module.exports._unconnected = ManualMigration;
