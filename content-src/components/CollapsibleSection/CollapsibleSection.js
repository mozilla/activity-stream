const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const {FormattedMessage} = require("react-intl");

const CollapsibleSection = React.createClass({
  getDefaultProps() {
    return {};
  },
  getInitialState() {
    return {isAnimating: false};
  },
  handleHeaderClick() {
    this.setState({isAnimating: true});
    this.props.dispatch(actions.NotifyPrefChange(this.props.prefName, !this.props.prefs[this.props.prefName]));
  },
  handleTransitionEnd() {
    this.setState({isAnimating: false});
  },
  renderIcon() {
    if (this.props.icon) {
      return <span className={classNames("icon", this.props.icon)} />;
    }

    return null;
  },
  render() {
    const isCollapsed = this.props.prefs[this.props.prefName];
    const isAnimating = this.state.isAnimating;

    return (
      <section className={classNames("collapsible-section", this.props.className, {"collapsed": isCollapsed})}>
        <h3 className="section-title" ref="title" onClick={this.handleHeaderClick}>
          {this.renderIcon()} <FormattedMessage id={this.props.titleId} />
          <span className={classNames("icon", {"icon-arrowhead-down": !isCollapsed, "icon-arrowhead-forward": isCollapsed})} />
        </h3>
        <div className={classNames("section-body", {"animating": isAnimating})} onTransitionEnd={this.handleTransitionEnd}>
          {this.props.children}
        </div>
      </section>
    );
  }
});

CollapsibleSection.propTypes = {
  className: React.PropTypes.string.isRequired,
  titleId: React.PropTypes.string.isRequired,
  prefName: React.PropTypes.string.isRequired,
  prefs: React.PropTypes.object.isRequired
};

module.exports = connect(justDispatch)(CollapsibleSection);
module.exports.CollapsibleSection = CollapsibleSection;
