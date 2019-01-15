import {connect} from "react-redux";
import {DSCard} from "../DSCard/DSCard.jsx";
import React from "react";

export class _CardGrid extends React.PureComponent {
  render() {
    const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];

    let truncateText = (text, cap) => `${text.substring(0, cap)}${text.length > cap ? `...` : ``}`;

    let cards = feed.data.recommendations.slice(1, this.props.items).map((rec, index) => (
      <DSCard
        key={`dscard-${index}`}
        image_src={rec.image_src}
        title={truncateText(rec.title, 44)}
        url={rec.url}
        source={truncateText(`TODO: SOURCE`, 22)} />
    ));

    // Handle a render before feed has been fetched by displaying nothing
    if (!feed) {
      return (
        <div />
      );
    }

    return (
      <div className="ds-card-grid">
        {cards}
      </div>
    );
  }
}

export const CardGrid = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_CardGrid);
