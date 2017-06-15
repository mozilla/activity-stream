const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

const AutoMigratePrompt = props => {
  if (!props.AutoMigrate.display) {
    return null;
  }

  return props.AutoMigrate.stage === 0 ?
    (<div className="migrate-prompt">
      <span>{props.AutoMigrate.msg}</span>
      <div className="confirm">
        <button onClick={props.onUndoClick}><FormattedMessage id="migrate_undo_button" /></button>
        <button className="primary" onClick={props.onImportClick}><FormattedMessage id="migrate_import_button" /></button>
      </div>
    </div>) : (<div className="migrate-prompt">
      <FormattedMessage id="migrate_manual_import_msg" />&nbsp;
      <a href="#" onClick={props.onManualImportClick}><FormattedMessage id="migrate_manual_import_link_msg" /></a>&nbsp;
      <FormattedMessage id="migrate_manual_import_msg_trail" />
    </div>);
};

AutoMigratePrompt.propTypes = {
  AutoMigrate: React.PropTypes.object.isRequired,
  onImportClick: React.PropTypes.func.isRequired,
  onManualImportClick: React.PropTypes.func.isRequired,
  onUndoClick: React.PropTypes.func.isRequired
};

module.exports = connect(
  state => ({AutoMigrate: state.AutoMigrate}),
  dispatch => ({
    onImportClick: () => dispatch(ac.SendToMain({type: at.AUTOMIGRATE_MIGRATE_DONE})),
    onManualImportClick: () => dispatch(ac.SendToMain({type: at.AUTOMIGRATE_MANUAL_IMPORT})),
    onUndoClick: () => dispatch(ac.SendToMain({type: at.AUTOMIGRATE_UNDO_MIGRATION}))
  })
)(injectIntl(AutoMigratePrompt));
module.exports._unconnected = AutoMigratePrompt;
