import {Button} from "../components/Button";
import React from "react";
import {SnippetBase} from "../components/SnippetBase";

const DEFAULT_ICON_PATH = "chrome://branding/content/icon64.png";

const styles = {
  title: {
    display: "inline",
    fontSize: "inherit",
    margin: 0
  },
  body: {
    display: "inline",
    margin: 0
  },
  icon: {
    height: "42px",
    width: "42px",
    marginInlineEnd: "12px",
    flexShrink: 0
  }
};

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
    return (<SnippetBase {...props}>
      <img src={props.content.icon || DEFAULT_ICON_PATH} style={styles.icon} />
      <div>
        {props.content.title ? <h3 style={styles.title}>{props.content.title}</h3> : null} <p style={styles.body}>{props.content.text}</p>
      </div>
      {props.content.button_url ? <div><Button onClick={this.onButtonClick} url={props.content.button_url}>{props.content.button_label}</Button></div> : null}
    </SnippetBase>);
  }
}
