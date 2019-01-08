import {connect} from "react-redux";
import React from "react";

export class _Hero extends React.PureComponent {
  render() {
    // const feed = this.props.DiscoveryStream.feeds[this.props.feed.url];
    return (
      <div>
        Hero
      </div>
    );
  }
}

export const Hero = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_Hero);
