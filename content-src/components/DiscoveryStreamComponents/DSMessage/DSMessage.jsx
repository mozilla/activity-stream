import React from "react";

export class DSMessage extends React.PureComponent {
  render() {
    return (
      <div className="ds-message">
        {this.props.title && (<header className="title">{this.props.title}</header>)}
        {this.props.subtitle && (
          <p className="subtitle">
            {this.props.subtitle && (<span>{this.props.subtitle}</span>)}
            {this.props.link_text && this.props.link_url && (<a href={this.props.link_url}>{this.props.link_text}</a>)}
          </p>
        )}
      </div>
     )
  }
}
