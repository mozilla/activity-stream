import React from "react";

export class SnippetBase extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onBlockClicked = this.onBlockClicked.bind(this);
  }

  onBlockClicked() {
    if (this.props.provider !== "preview") {
      this.props.sendUserActionTelemetry({event: "BLOCK", id: this.props.UISurface});
    }

    this.props.onBlock();
  }

  renderDismissButton() {
    if (this.props.footerDismiss) {
      return (
        <div className="footer">
          <div className="footer-content">
            <button className="ASRouterButton secondary" onClick={this.props.onDismiss}>{this.props.content.dismiss_button_label}</button>
          </div>
        </div>
      );
    }

    return (
      <button className="blockButton" onClick={this.onBlockClicked} />
    );
  }

  render() {
    const {props} = this;

    const containerClassName = `SnippetBaseContainer${props.className ? ` ${props.className}` : ""}`;

    return (<div className={containerClassName}>
      <div className="innerWrapper">
        {props.children}
      </div>
      {this.renderDismissButton()}
    </div>);
  }
}
