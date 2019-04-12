import React from "react";
import {RichText} from "../../components/RichText/RichText";
import {safeURI} from "../../template-utils";
import {SnippetBase} from "../../components/SnippetBase/SnippetBase";

const DEFAULT_ICON_PATH = "chrome://branding/content/icon64.png";

export class SimpleBelowSearchSnippet extends React.PureComponent {
  renderText() {
    const {props} = this;
    return (<RichText text={props.content.text}
      customElements={this.props.customElements}
      localization_id="text"
      links={props.content.links}
      sendClick={props.sendClick} />);
  }

  render() {
    const {props} = this;
    let className = "SimpleBelowSearchSnippet";

    if (props.className) {
      className += ` ${props.className}`;
    }

    return (<SnippetBase {...props} className={className} textStyle={this.props.textStyle}>
      <img src={safeURI(props.content.icon) || DEFAULT_ICON_PATH} className="icon" />
      <div>
        <p className="body">{this.renderText()}</p>
        {this.props.extraContent}
      </div>
    </SnippetBase>);
  }
}
