import React from "react";

export class DSCard extends React.PureComponent {
  render() {
    return (
      <div className="ds-card">
        <div className="img-wrapper">
          <div className="img" style={{backgroundImage: `url(${this.props.image_src}`}} />
        </div>
        <div className="meta">
          <header>{this.props.title}</header>
          <p>{this.props.excerpt}</p>
          <p>{this.props.source}</p>
        </div>
      </div>
    );
  }
}
