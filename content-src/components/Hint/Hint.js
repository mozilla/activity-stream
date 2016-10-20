const React = require("react");
const {connect} = require("react-redux");
const {DisableHint} = require("common/action-manager").actions;

/**
 * Hint - A component for helping onboard users to different features
 *        It displays a small bit of text that, if clicked, shows a tooltip with
 *        a description of the feature
 */
const Hint = React.createClass({
  getDefaultProps() {
    return {disabled: false};
  },
  getInitialState() {
    return {active: false};
  },
  hide() {
    this.setState({active: false});
  },
  componentDidUpdate(prevProps, prevState) {
    if (this.state.active && !prevState.active) {
      // Timeout needed or else this.hide will be triggered from onClickPrompt
      setTimeout(() => {
        window.addEventListener("click", this.hide, false);
      }, 0);
    }
    if (!this.state.active && prevState.active) {
      window.removeEventListener("click", this.hide);
    }
  },
  componentWillUnmount() {
    window.removeEventListener("click", this.hide);
  },
  onClickPrompt(e) {
    e.preventDefault();
    this.setState({active: !this.state.active});
  },
  onDisable(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({active: false});
    this.props.dispatch(DisableHint(this.props.id));
  },
  render() {
    // Note: refs are for testing hooks
    return (<div className="hint-container" hidden={this.props.disabled} ref="container">
      <span className="tooltip-tip" />
      &ndash; <a className="prompt" href="#" onClick={this.onClickPrompt} ref="prompt"> What&rsquo;s this?</a>
      <div className="explanation" hidden={!this.state.active} ref="explanation">
        <h3 ref="title">{this.props.title}</h3>
        <p ref="body">{this.props.body}</p>
        <button className="close-button" onClick={this.onDisable} ref="closeButton">
          <h4>Okay, got it!</h4>
          <p>Don&rsquo;t show this tip again</p>
        </button>
      </div>
    </div>);
  }
});

Hint.propTypes = {
  id: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  body: React.PropTypes.string.isRequired
};

module.exports = connect((state, props) => ({disabled: state.Hints[props.id] === false}))(Hint);
module.exports.Hint = Hint;
