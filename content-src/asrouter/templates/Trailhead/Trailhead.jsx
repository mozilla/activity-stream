import {OnboardingCard} from "../OnboardingMessage/OnboardingMessage";
import React from "react";

export class Trailhead extends React.PureComponent {
  render() {
    const {props} = this;
    const {content} = props.message;

    return (<div className="overlay-wrapper show trailhead">
      <div className="trailheadInner">
        <div className="trailheadContent">
          <h3>{content.title}</h3>
          <p>{content.subtitle}</p>
        </div>
        <div className="trailheadCards">
          <div className="onboardingMessageContainer">
          {content.cards.map(card => (
            <OnboardingCard key={card.id}
              sendUserActionTelemetry={props.sendUserActionTelemetry}
              onAction={props.onAction}
              UISurface="TRAILHEAD"
              {...card} />
          ))}
          </div>
        </div>
        <div className="trailheadContent">
          <h2>{content.ctaHeader}</h2>
          <p>{content.ctaText}</p>
        </div>
      </div>

    </div>);
  }
}
