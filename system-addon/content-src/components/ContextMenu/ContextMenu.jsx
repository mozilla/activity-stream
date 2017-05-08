const React = require("react");

class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.hideContext = this.hideContext.bind(this);
  }
  hideContext() {
    this.props.onUpdate(false);
  }
  componentWillMount() {
    this.hideContext();
  }
  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      setTimeout(() => {
        window.addEventListener("click", this.hideContext);
      }, 0);
    }
    if (!this.props.visible && prevProps.visible) {
      window.removeEventListener("click", this.hideContext);
    }
  }
  componentDidUnmount() {
    window.removeEventListener("click", this.hideContext);
  }
  onKeyDown(index) {
    if (index > this.props.tabbableOptionsLength) {
      this.hideContext();
    }
  }
  render() {
    return (<span hidden={!this.props.visible} className="context-menu">
      <ul role="menu" className="context-menu-list">
      {this.props.options.map((option, i) => {
        if (option.type === "separator") {
          return (<li key={i} className="separator" />);
        }
        return (<li role="menuitem" className="context-menu-item" key={i}>
          <a onKeyDown={e => this.onKeyDown(i)} tabIndex="0">
          {option.icon && <span className={`icon icon-spacer icon-${option.icon}`} />}
          {option.label}
          </a></li>);
      })}
      </ul>
    </span>);
  }
}

module.exports = ContextMenu;
