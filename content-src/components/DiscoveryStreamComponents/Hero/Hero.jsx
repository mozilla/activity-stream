import {connect} from "react-redux";
import React from "react";
import {DSCard} from "../DSCard/DSCard.jsx"

export class _Hero extends React.PureComponent {
  constructor(props) {
    super(props);

    const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];

    this.state = {
      recommendations: feed.data.recommendations
    };
  }

  render() {
    console.log(this.state.recommendations);

    let heroRec = this.state.recommendations[0];

    // TODO: Let this count be determined by the endpoint
    let cards = this.state.recommendations.slice(1,5).map((rec, index) => {
      return (
        <DSCard
          image_src={rec.image_src}
          title={rec.title}
          excerpt={rec.excerpt}
          source="TODO: SOURCE">
        </DSCard>
      );
    });

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
