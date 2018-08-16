import {Button} from "../../components/Button/Button";
import React from "react";
import {safeURI} from "../../template-utils";
import {SnippetBase} from "../../components/SnippetBase/SnippetBase";

const DEFAULT_ICON_PATH = "chrome://branding/content/icon64.png";

export class SimpleSnippet extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  onButtonClick() {
    this.props.sendUserActionTelemetry({event: "CLICK_BUTTON", id: this.props.UISurface});
    if (this.props.content.button_action) {
      this.props.onAction(this.props.content.button_action);
    }
  }

  renderTitle() {
    const {title} = this.props.content;
    return title ? <h3 className="title">{title}</h3> : null;
  }

  renderTitleIcon() {
    const titleIcon = safeURI(this.props.content.title_icon);
    return titleIcon ? <span className="titleIcon" style={{backgroundImage: `url("${titleIcon}")`}} /> : null;
  }

  renderButton(className) {
    const {props} = this;
    const hasLink = props.content.button_url && props.content.button_type === "anchor";

    if (!hasLink && !props.content.button_action) {
      return null;
    }

    return (<Button
      className={className}
      onClick={this.onButtonClick}
      url={props.content.button_url}
      color={props.content.button_color}
      backgroundColor={props.content.button_background_color}>
      {props.content.button_label}
    </Button>);
  }

  render() {
    const {props} = this;
    const hasButton = props.content.button_url && !props.content.button_type;
    const className = `SimpleSnippet${props.content.tall ? " tall" : ""}`;
    return (<SnippetBase {...props} className={className}>
      <img src={safeURI(props.content.icon) || DEFAULT_ICON_PATH} className="icon" />
      <div>
        {this.renderTitleIcon()} {this.renderTitle()} <p className="body">{props.richText || props.content.text}</p> {this.renderButton("ASRouterAnchor")}
      </div>
      {hasButton ? <div>{this.renderButton()}</div> : null}
    </SnippetBase>);
  }
}
