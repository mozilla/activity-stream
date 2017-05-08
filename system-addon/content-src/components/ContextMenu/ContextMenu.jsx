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
  onKeyDown(event, option) {
    switch (event.key) {
      case "Tab":
        // tab goes down in context menu, shift + tab goes up in context menu
        // if we're on the last item, one more tab will close the context menu
        // similarly, if we're on the first item, one more shift + tab will close it
        if ((event.shiftKey && option.first) || (!event.shiftKey && option.last)) {
          this.hideContext();
        }
        break;
      case "Enter":
        this.hideContext();
        option.onClick();
        break;
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
          <a tabIndex="0"
            onKeyDown={e => this.onKeyDown(e, option)}
            onClick={() => {
              this.hideContext();
              option.onClick();
            }}>
          {option.icon && <span className={`icon icon-spacer icon-${option.icon}`} />}
          {option.label}
          </a></li>);
      })}
      </ul>
    </span>);
  }
}

module.exports = ContextMenu;
