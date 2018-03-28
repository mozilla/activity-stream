import Raven from "raven-js";
import React from "react";

export class SentryProvider extends React.PureComponent {
  constructor(props) {
    super(props);
    if (this.props.fakeRaven) {
      this.raven = this.props.fakeRaven;
    } else {
      this.raven = Raven;
    }
  }

  componentDidMount() {
    // The React docs say not to put side-effects or subscriptions in
    // componentWillMount, so we're doing it here.
    this.maybeInitializeRaven();
  }

  maybeInitializeRaven() {
    if (this.isRavenPrefEnabled()) {
      this.initializeRaven();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.initialized || this.props.initialized) {
      return;
    }

    this.maybeInitializeRaven();
  }

  isRavenPrefEnabled() {
    const {props} = this;
    if (props.initialized && props.dataReportingUploadEnabled &&
      props.telemetry) {
      return true;
    }

    return false;
  }

  /**
   * @note We need to use the "secret" DSN because about:* are not real origins,
   * and the using the "secret" DSN works around issues related to that.  See
   * https://bugzilla.mozilla.org/show_bug.cgi?id=1446142 for details.
   *
   */
  initializeRaven() {
    const ravenOptions  = {allowSecretKey: true};
    const sentryDsn =
      "https://8f7472f5a012407e9056a886648e91fd:883d9882e50847df83dad975a2f606ae@sentry.prod.mozaws.net/150";

    // XXXYYY add release for now
    this.raven.config(sentryDsn, ravenOptions).install();
  }

  render() {
    if (!this.props.children) {
      return null;
    }

    return this.props.children;
  }
}
