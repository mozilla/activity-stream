import {actionCreators as ac} from "common/Actions.jsm";
import {ImpressionStats} from "../../DiscoveryStreamImpressionStats/ImpressionStats";
import React from "react";
import {SafeAnchor} from "../SafeAnchor/SafeAnchor";

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
      <SafeAnchor url={this.props.url} className="ds-card" onLinkClick={this.onLinkClick}>
        <div className="img-wrapper">
          <div className="img" style={{backgroundImage: `url(${this.props.image_src}`}} />
        </div>
        <div className="meta">
          <div className="info-wrap">
            <header className="title">{this.props.title}</header>
            {this.props.excerpt && <p className="excerpt">{this.props.excerpt}</p>}
          </div>
          <p>
            {this.props.context && (
              <span>
                <span className="context">{this.props.context}</span>
                <br />
              </span>
            )}
            <span className="source">{this.props.source}</span>
          </p>
        </div>
        <ImpressionStats
          campaignId={this.props.campaignId}
          rows={[{id: this.props.id}]}
          dispatch={this.props.dispatch}
          source={this.props.type} />
      </SafeAnchor>
    );
  }
}
