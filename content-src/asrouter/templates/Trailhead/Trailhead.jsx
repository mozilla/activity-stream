import {OnboardingCard} from "../OnboardingMessage/OnboardingMessage";
import React from "react";

export class Trailhead extends React.PureComponent {
  render() {
    const {props} = this;
    return (<div className="overlay-wrapper show trailhead">
      <div className="trailheadInner">
        <div className="trailheadContent">
          <h1>This is not the real design. <br /> It is just a functional prototype.</h1>
          <p>This is just demonstrating a single-stage flow instead of the regular one.</p>
        </div>
        <div className="trailheadCards">
          <div className="trailheadContent">
            <h2>More than just a browser</h2>
          </div>
          <div className="onboardingMessageContainer">
          {props.message.content.cards.map(card => (
            <OnboardingCard key={card.id}
              sendUserActionTelemetry={props.sendUserActionTelemetry}
              onAction={props.onAction}
              UISurface="TRAILHEAD"
              {...card} />
          ))}
          </div>
        </div>
      </div>

    </div>);
  }
}
