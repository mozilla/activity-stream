import {connect} from "react-redux";
import {DSCard} from "../DSCard/DSCard.jsx";
import React from "react";

export class _Hero extends React.PureComponent {
  render() {
    const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];

    // Handle a render before feed has been fetched by displaying nothing
    if (!feed) {
      return (
        <div />
      );
    }

    let [heroRec, ...otherRecs] = feed.data.recommendations;

    let cards = otherRecs.slice(1, this.props.items).map((rec, index) => (
      <DSCard
        key={`dscard-${index}`}
        image_src={rec.image_src}
        title={rec.title}
        excerpt={rec.excerpt}
        source="TODO: SOURCE" />
    ));

    return (
      <div className={`ds-hero ds-hero-${this.props.style}`}>
        <div className="wrapper">
          <div className="img-wrapper">
            <div className="img" style={{backgroundImage: `url(${heroRec.image_src})`, border: `1px solid pink`}} />
          </div>
          <div className="meta">
            <header>{heroRec.title}</header>
            <p>{heroRec.excerpt}</p>
            <p>TODO: SOURCE</p>
          </div>
        </div>
        <div className="cards">
          { cards }
        </div>
      </div>
    );
  }
}

_Hero.defaultProps = {
  style: `border`,
  items: 1, // Number of stories to display
};

export const Hero = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_Hero);
