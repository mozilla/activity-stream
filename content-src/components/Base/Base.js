const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("actions/action-manager");

const Base = React.createClass({
  componentDidMount() {
    this.props.dispatch(actions.RequestTopFrecent());

    this.props.dispatch(actions.RequestRecentLinks());

    this.props.dispatch(actions.RequestFrecentLinks());

    this.props.dispatch(actions.RequestBookmarks());

    this.props.dispatch(actions.RequestSearchState());
  },
  render() {
    return (<div id="base">
      {this.props.children}
    </div>);
  }
});

module.exports = connect(justDispatch)(Base);
