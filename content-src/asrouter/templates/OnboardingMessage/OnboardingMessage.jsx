import {ModalOverlay} from "../../components/ModalOverlay/ModalOverlay";
import React from "react";

export class OnboardingCard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    const {props} = this;
    const ping = {
      event: "CLICK_BUTTON",
      message_id: props.id,
      id: props.UISurface,
    };
    props.sendUserActionTelemetry(ping);
    props.onAction(props.content.primary_button.action);
  }

  render() {
    const {content} = this.props;
    return (
      <div className="onboardingMessage">
        <div className={`onboardingMessageImage ${content.icon}`} />
        <div className="onboardingContent">
          <span>
            <h3 data-l10n-id={content.title}>{content.title}</h3>
            <p data-l10n-id={content.text}>{content.text}</p>
          </span>
          <span>
            <button data-l10n-id={content.primary_button.label}
              tabIndex="1"
              className="button onboardingButton"
              onClick={this.onClick}>{content.primary_button.label}</button>
          </span>
        </div>
      </div>
    );
  }
}

export class OnboardingMessage extends React.PureComponent {
  render() {
    const {props} = this;
    const {button_label, header} = props.extraTemplateStrings;
    return (
      <ModalOverlay {...props} button_label={button_label} title={header}>
        <div className="onboardingMessageContainer">
          {props.bundle.map(message => (
            <OnboardingCard key={message.id}
              sendUserActionTelemetry={props.sendUserActionTelemetry}
              onAction={props.onAction}
              UISurface={props.UISurface}
              {...message} />
          ))}
        </div>
      </ModalOverlay>
    );
  }
}
