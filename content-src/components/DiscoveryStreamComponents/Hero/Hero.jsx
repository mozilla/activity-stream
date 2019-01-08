import {connect} from "react-redux";
import React from "react";

export class _Hero extends React.PureComponent {
// TODO: Un-hardcode all these values
  render() {
    // const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];
    return (
      <div className={`ds-hero ds-hero-${this.props.style}`}>
        <div className="wrapper">
          <img src="https://placekitten.com/576/324" />
          <div className="meta">
            <header>Lorem Ipsum</header>
            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Vel quod, adipisci culpa ad ex officia totam quas animi non esse in quaerat consectetur sint at veritatis! Voluptatibus incidunt quidem facere!</p>
            <p>Source</p>
          </div>
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
