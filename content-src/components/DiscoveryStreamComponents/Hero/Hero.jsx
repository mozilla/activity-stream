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
    let heroRec = this.state.recommendations[0];

    return (
      <div className={`ds-hero ds-hero-${this.props.style}`}>
        <div className="wrapper">
          <img src={heroRec.image_src} />
          <div className="meta">
            <header>{heroRec.title}</header>
            <p>{heroRec.excerpt}</p>
            <p>TODO: Source?</p>
          </div>
        </div>
        <div className="cards">
          <DSCard></DSCard>

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
