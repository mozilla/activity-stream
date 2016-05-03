const React = require("react");

const ContextMenu = React.createClass({
  componentWillMount() {
    this.hideContext = () => {
      this.props.onUpdate(false);
      window.removeEventListener("click", this.hideContext);
    };
  },
  componentWillUnmount() {
    window.removeEventListener("click", this.hideContext);
  },
  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      setTimeout(() => {
        window.addEventListener("click", this.hideContext, false);
      }, 0);
    }
  },
  render() {
    return (<span hidden={!this.props.visible} className="context-menu">
      <ul>
        {this.props.options.map((option, i) => {
          return (<li key={i}><a className="context-menu-link" onClick={() => {
            this.props.onUpdate(false);
            option.onClick();
          }}>{option.label}</a></li>);
        })}
      </ul>
    </span>);
  }
});

ContextMenu.propTypes = {
  visible: React.PropTypes.bool,
  onUpdate: React.PropTypes.func.isRequired,
  options: React.PropTypes.arrayOf(React.PropTypes.shape({
    label: React.PropTypes.string.isRequired,
    onClick: React.PropTypes.func.isRequired
  })).isRequired
};

module.exports = ContextMenu;
