import {actionCreators as ac} from "common/Actions.jsm";
import React from "react";

export class DSCard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onLinkClick = this.onLinkClick.bind(this);
  }

  onLinkClick(event) {
    if (this.props.dispatch) {
      this.props.dispatch(ac.UserEvent({
        event: "CLICK",
        source: this.props.type.toUpperCase(),
        action_position: this.props.index,
      }));

      this.props.dispatch(ac.ImpressionStats({
        source: this.props.type.toUpperCase(),
        click: 0,
        tiles: [{id: this.props.id, pos: this.props.index}],
      }));
    }
  }

  render() {
    return (
      <a href={this.props.url} className="ds-card" onClick={this.onLinkClick}>
        <div className="img-wrapper">
          <div className="img" style={{backgroundImage: `url(${this.props.image_src}`}} />
        </div>
        <div className="meta">
          <header className="title">{this.props.title}</header>
          {this.props.excerpt && <p className="excerpt">{this.props.excerpt}</p>}
          {this.props.context ? (
            <p className="context">{this.props.context}</p>
          ) : (
            <p className="source">{this.props.source}</p>
          )}
        </div>
      </a>
    );
  }
}
