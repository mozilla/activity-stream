import React from "react";

export class DSCard extends React.PureComponent {
  render() {
    return (
      <a href={this.props.url} className="ds-card">
        <div className="img-wrapper">
          <div className="img" style={{backgroundImage: `url(${this.props.image_src}`}} />
        </div>
        <div className="meta">
          <header className="title">{this.props.title}</header>
          <p className="excerpt">{this.props.excerpt}</p>
          <p className="source">{this.props.source}</p>
        </div>
      </a>
    );
  }
}
