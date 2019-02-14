import React from "react";

export class DSMessage extends React.PureComponent {
  render() {
    let hasSubtitleAndOrLink = this.props.link_text && this.props.link_url;
    hasSubtitleAndOrLink = hasSubtitleAndOrLink || this.props.subtitle;

    return (
      <div className="ds-message">
        <header className="title">
          {this.props.icon && (<div className="glyph" style={{backgroundImage: `url(${this.props.icon})`}} />)}
          {this.props.title && (<span className="title-text">{this.props.title}</span>)}
          {this.props.link_text && this.props.link_url && (<a className="link" href={this.props.link_url}>{this.props.link_text}</a>)}
        </header>
      </div>
    );
  }
}
