import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import React from "react";

export class DSEmptyState extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onReset = this.onReset.bind(this);
  }

  onReset() {
    if (this.props.dispatch && this.props.feed) {
      this.props.dispatch(ac.OnlyToMain({type: at.DISCOVERY_STREAM_RETRY_FEED, data: {feed: this.props.feed}}));
    }
  }

  renderButton() {
    if (this.props.status === "waiting") {
      return (
        <button className="try-again-button waiting">Loading...</button>
      );
    }

    return (
      <button className="try-again-button" onClick={this.onReset}>Try Again</button>
    );
  }

  renderState() {
    if (this.props.status === "waiting" || this.props.status === "failed") {
      return (
        <React.Fragment>
          <h2>Oops! We almost loaded this section, but not quite.</h2>
          {this.renderButton()}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <h2>You are caught up!</h2>
        <p>Check back later for more stories.</p>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="section-empty-state">
        <div className="empty-state-message">
          {this.renderState()}
        </div>
      </div>
    );
  }
}
