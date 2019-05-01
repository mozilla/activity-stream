import React from "react";

export const ModalOverlayWrapper = props => (<>
  <div className={`modalOverlayOuter ${props.active ? "active" : ""}`} />
  <div className={`modalOverlayInner ${props.active ? "active" : ""} ${props.innerClassName || ""}`}>
    {props.children}
  </div>
</>);

export class ModalOverlay extends React.PureComponent {
  componentWillMount() {
    this.setState({active: true});
    document.body.classList.add("modal-open");
  }

  componentWillUnmount() {
    document.body.classList.remove("modal-open");
    this.setState({active: false});
  }

  render() {
    const {active} = this.state;
    const {title, button_label} = this.props;
    return (
      <ModalOverlayWrapper active={active}>
        <h2> {title} </h2>
        {this.props.children}
        <div className="footer">
          <button className="button primary modalButton"
            onClick={this.props.onDoneButton}> {button_label} </button>
        </div>
      </ModalOverlayWrapper>);
  }
}
