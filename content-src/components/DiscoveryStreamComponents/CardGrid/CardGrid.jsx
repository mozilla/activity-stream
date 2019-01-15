import {connect} from "react-redux";
import {DSCard} from "../DSCard/DSCard.jsx";
import React from "react";

export class _CardGrid extends React.PureComponent {
  render() {
    const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];

    // Handle a render before feed has been fetched by displaying nothing
    if (!feed) {
      return (
        <div />
      );
    }

    let cards = feed.data.recommendations.slice(0, this.props.items).map((rec, index) => (
      <DSCard
        key={`dscard-${index}`}
        image_src={rec.image_src}
        title={rec.title}
        excerpt={rec.title}
        url={rec.url}
        source={`TODO: SOURCE`} />
    ));

    return (
      <div className="ds-card-grid">
        {cards}
      </div>
    );
  }
}

_CardGrid.defaultProps = {
  style: `border`,
  items: 4, // Number of stories to display
};

export const CardGrid = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_CardGrid);
