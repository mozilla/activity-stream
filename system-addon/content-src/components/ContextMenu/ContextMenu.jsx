import React from "react";

export class ContextMenu extends React.PureComponent {
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
  componentWillUnmount() {
    window.removeEventListener("click", this.hideContext);
  }
  render() {
    return (<span hidden={!this.props.visible} className="context-menu">
      <ul role="menu" className="context-menu-list">
        {this.props.options.map((option, i) => (option.type === "separator" ?
          (<li key={i} className="separator" />) :
          (<ContextMenuItem key={i} option={option} hideContext={this.hideContext} />)
        ))}
      </ul>
    </span>);
  }
}

export class ContextMenuItem extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }
  onClick() {
    this.props.hideContext();
    this.props.option.onClick();
  }
  onKeyDown(event) {
    const {option} = this.props;
    switch (event.key) {
      case "Tab":
        // tab goes down in context menu, shift + tab goes up in context menu
        // if we're on the last item, one more tab will close the context menu
        // similarly, if we're on the first item, one more shift + tab will close it
        if ((event.shiftKey && option.first) || (!event.shiftKey && option.last)) {
          this.props.hideContext();
        }
        break;
      case "Enter":
        this.props.hideContext();
        option.onClick();
        break;
    }
  }
  render() {
    const {option} = this.props;
    return (
      <li role="menuitem" className="context-menu-item">
        <a onClick={this.onClick} onKeyDown={this.onKeyDown} tabIndex="0">
          {option.icon && <span className={`icon icon-spacer icon-${option.icon}`} />}
          {option.label}
        </a>
      </li>);
  }
}
