import {connect} from "react-redux";
import {DSCard} from "../DSCard/DSCard.jsx";
import React from "react";

export class _Hero extends React.PureComponent {
  render() {
    const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];
    let [heroRec, ...otherRecs] = feed.data.recommendations;

    // TODO: Let this count be determined by the endpoint
    let cards = otherRecs.slice(1, 5).map((rec, index) => (
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
          <div className="meta">
            <header>{heroRec.title}</header>
            <p>{heroRec.excerpt}</p>
            <p>TODO: SOURCE</p>
          </div>
          <img src={heroRec.image_src} />
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
  items: 1,
};

export const Hero = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_Hero);
