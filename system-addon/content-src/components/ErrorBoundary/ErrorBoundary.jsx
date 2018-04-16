import {FormattedMessage} from "react-intl";
import Raven from "raven-js";
import React from "react";

export class ErrorBoundaryFallback extends React.PureComponent {
  constructor(props) {
    super(props);
    this.windowObj = this.props.windowObj || window;
    this.onClick = this.onClick.bind(this);
  }

  /**
   * Since we only get here if part of the page has crashed, do a
   * forced reload to give us the best chance at recovering.
   */
  onClick() {
    this.windowObj.location.reload(true);
  }

  render() {
    const defaultClass = "as-error-fallback";
    let className;
    if ("className" in this.props) {
      className = `${this.props.className} ${defaultClass}`;
    } else {
      className = defaultClass;
    }

    // href="#" to force normal link styling stuff (eg cursor on hover)
    return (
      <div className={className}>
        <div>
          <FormattedMessage
            defaultMessage="Oops, something went wrong loading this content."
            id="error_fallback_default_info" />
        </div>
        <span>
          <a href="#" className="reload-button" onClick={this.onClick}>
            <FormattedMessage
              defaultMessage="Refresh page to try again."
              id="error_fallback_default_refresh_suggestion" />
          </a>
        </span>
      </div>
    );
  }
}
ErrorBoundaryFallback.defaultProps = {className: "as-error-fallback"};

export class ErrorBoundary extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
    this.raven = props.fakeRaven || Raven;
  }

  componentDidCatch(error, info) {
    this.setState({hasError: true});

    // XXX It's possible that we should, in theory, be calling Raven.isSetup()
    // here and only trying to capture the exception has been setup.  However,
    // captureException doesn't actually send anything if Raven is turned off.

    // Note that of the extra info, we explicitly ONLY pass through the stack
    // trace, since if future versions of React add other pieces of extra info
    // to this callback, we don't want to just blindly send them as well.
    this.raven.captureException(
      error,
      {extra: {componentStack: info.componentStack}}
    );
  }

  render() {
    if (!this.state.hasError) {
      return (this.props.children);
    }

    return <this.props.FallbackComponent className={this.props.className} />;
  }
}

ErrorBoundary.defaultProps = {FallbackComponent: ErrorBoundaryFallback};
