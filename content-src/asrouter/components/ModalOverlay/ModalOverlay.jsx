import React from "react";
const {useEffect} = React;

export const useEscapeKeyCallback = props => {
  const {isActive, callback} = props;
  const doc = props.document || global.document;

  const onKeyDown = event => {
    if (event.key === "Escape") { callback(); }
  };

  useEffect(() => {
    if (isActive) {
      doc.addEventListener("keydown", onKeyDown);
      return () => {
        doc.removeEventListener("keydown", onKeyDown);
      };
    }
    return undefined;
  });
};

export const ModalOverlayWrapper = props => {
  // If you press escape, close the modal!
  useEscapeKeyCallback({isActive: props.active, callback: props.onClose, document: props.document});

  return (<React.Fragment>
    <div className={`modalOverlayOuter ${props.active ? "active" : ""}`} onClick={props.onClose} />
    <div className={`modalOverlayInner ${props.active ? "active" : ""} ${props.innerClassName || ""}`}>
      {props.children}
    </div>
  </React.Fragment>);
};

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
          <button tabIndex="2" onClick={this.props.onDoneButton} className="button primary modalButton"> {button_label} </button>
        </div>
      </ModalOverlayWrapper>);
  }
}
