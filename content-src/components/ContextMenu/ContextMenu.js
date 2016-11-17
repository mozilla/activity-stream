const React = require("react");

const ContextMenu = React.createClass({
  componentWillMount() {
    this.hideContext = () => {
      this.props.onUpdate(false);
    };
  },
  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      setTimeout(() => {
        window.addEventListener("click", this.hideContext, false);
      }, 0);
    }
    if (!this.props.visible && prevProps.visible) {
      window.removeEventListener("click", this.hideContext);
    }
  },
  render() {
    return (<span hidden={!this.props.visible} className="context-menu">
      <ul>
        {this.props.options.map((option, i) => {
          if (option.type === "separator") {
            return (<li key={i} className="separator" />);
          }
          if (option.type === "submenu") {
            return (<li key={i}><div
              className="submenu"
              ref={option.ref}
              onClick={ev => {
                ev.stopPropagation();
              }}>
              {option.icon && <span className={`icon icon-spacer icon-${option.icon}`} />}
              {option.label}
              <span className={"icon icon-spacer icon-menu-arrow"} />
              <ContextMenu
                visible={this.props.visible}
                onUpdate={this.props.onUpdate}
                onUserEvent={this.userEvent}
                options={option.options} />
            </div></li>);
          }
          return (<li key={i}><a
            className="context-menu-link"
            ref={option.ref}
            onClick={() => {
              this.props.onUpdate(false);
              option.onClick();
              if (option.userEvent) {
                this.props.onUserEvent(option.userEvent);
              }
            }}>
            {option.icon && <span className={`icon icon-spacer icon-${option.icon}`} />}
            {option.iconURL && <span className={"icon icon-spacer"} style={{backgroundImage: `url(${option.iconURL})`}} />}
            {option.label}
          </a></li>);
        })}
      </ul>
    </span>);
  }
});

ContextMenu.propTypes = {
  visible: React.PropTypes.bool,
  onUpdate: React.PropTypes.func.isRequired,
  onUserEvent: React.PropTypes.func,
  options: React.PropTypes.arrayOf(React.PropTypes.shape({
    type: React.PropTypes.string,
    label: React.PropTypes.string,
    icon: React.PropTypes.string,
    iconURL: React.PropTypes.string,
    onClick: React.PropTypes.func,
    userEvent: React.PropTypes.string,
    ref: React.PropTypes.string
  })).isRequired
};

module.exports = ContextMenu;
