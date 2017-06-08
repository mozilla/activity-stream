const React = require("react");
const {connect} = require("react-redux");
const {injectIntl} = require("react-intl");

class AutoMigratePrompt extends React.Component {
  render() {
    let migratedMessage = (<div className="migration-prompt">
      <span>Dive right into Firefox! Import your favorate sites, bookmarks, history and passwords from Chrome</span>
      <div className="confirm">
        <button>Don't Import</button>
        <button className="done">Import It</button>
      </div>
    </div>);

    // let migrationIsRevertedMessage = (<div className="migration-prompt">
    //  No problem. We can start you off with a few popular sites instead.
    //  You can always <a href="#">import your information</a> later.
    // </div>);

    return migratedMessage;
    // return (<div>
    //   {this.props.AutoMigrate.msg}
    // </div>);

    // if (this.props.AutoMigrate.display) {
    //   if (this.props.AutoMigrate.stage === 0) {
    //     return migratedMessage;
    //   } else {
    //     return migrationIsRevertedMessage;
    //   }
    // } else {
    //   return;
    // }
  }
}

module.exports = connect(state => ({AutoMigrate: state.AutoMigrate}))(injectIntl(AutoMigratePrompt));
module.exports._unconnected = AutoMigratePrompt;
module.exports = AutoMigratePrompt;
