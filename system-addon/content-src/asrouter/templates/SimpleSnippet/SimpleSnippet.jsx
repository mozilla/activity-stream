import {Button} from "../../components/Button/Button";
import React from "react";
import {SnippetBase} from "../../components/SnippetBase/SnippetBase";

const DEFAULT_ICON_PATH = "chrome://branding/content/icon64.png";

export class SimpleSnippet extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  onButtonClick() {
    this.props.sendUserActionTelemetry({event: "CLICK_BUTTON", source: this.props.UISurface, message_id: this.props.id});
  }

  render() {
    const {props} = this;
    return (<SnippetBase {...props} className="SimpleSnippet">
      <img src={props.content.icon || DEFAULT_ICON_PATH} className="icon" />
      <div>
        {props.content.title ? <h3 className="title">{props.content.title}</h3> : null} <p className="body">{props.content.text}</p>
      </div>
      {props.content.button_url ? <div><Button onClick={this.onButtonClick} url={props.content.button_url}>{props.content.button_label}</Button></div> : null}
    </SnippetBase>);
  }
}
