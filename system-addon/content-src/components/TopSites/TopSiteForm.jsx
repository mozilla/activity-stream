import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {FormattedMessage} from "react-intl";
import React from "react";
import {TOP_SITES_SOURCE} from "./TopSitesConstants";

export class TopSiteForm extends React.PureComponent {
  constructor(props) {
    super(props);
    const {TopSite} = props;
    this.state = {
      label: TopSite ? (TopSite.label || TopSite.hostname) : "",
      url: TopSite ? TopSite.url : "",
      validationError: false
    };
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onDoneButtonClick = this.onDoneButtonClick.bind(this);
    this.onUrlInputMount = this.onUrlInputMount.bind(this);
  }

  onLabelChange(event) {
    this.resetValidation();
    this.setState({"label": event.target.value});
  }

  onUrlChange(event) {
    this.resetValidation();
    this.setState({"url": event.target.value});
  }

  onCancelButtonClick(ev) {
    ev.preventDefault();
    this.props.onClose();
  }

  onDoneButtonClick(ev) {
    ev.preventDefault();

    if (this.validateForm()) {
      const site = {url: this.cleanUrl()};
      const index = this.props.index || -1;
      if (this.state.label !== "") {
        site.label = this.state.label;
      }

      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_PIN,
        data: {site, index}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_EDIT",
        action_position: index
      }));

      this.props.onClose();
    }
  }

  cleanUrl() {
    let {url} = this.state;
    // If we are missing a protocol, prepend http://
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      url = `http://${url}`;
    }
    return url;
  }

  resetValidation() {
    if (this.state.validationError) {
      this.setState({validationError: false});
    }
  }

  validateUrl() {
    try {
      return !!new URL(this.cleanUrl());
    } catch (e) {
      return false;
    }
  }

  validateForm() {
    this.resetValidation();
    // Only the URL is required and must be valid.
    if (!this.state.url || !this.validateUrl()) {
      this.setState({validationError: true});
      this.inputUrl.focus();
      return false;
    }
    return true;
  }

  onUrlInputMount(input) {
    this.inputUrl = input;
  }

  render() {
    // For UI purposes, editing without an existing link is "add"
    const showAsAdd = !this.props.TopSite;

    return (
      <form className="topsite-form">
        <section className="edit-topsites-inner-wrapper">
          <div className="form-wrapper">
            <h3 className="section-title">
              <FormattedMessage id={showAsAdd ? "topsites_form_add_header" : "topsites_form_edit_header"} />
            </h3>
            <div className="field title">
              <input
                type="text"
                value={this.state.label}
                onChange={this.onLabelChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_title_placeholder"})} />
            </div>
            <div className={`field url${this.state.validationError ? " invalid" : ""}`}>
              <input
                type="text"
                ref={this.onUrlInputMount}
                value={this.state.url}
                onChange={this.onUrlChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_url_placeholder"})} />
              {this.state.validationError &&
                <aside className="error-tooltip">
                  <FormattedMessage id="topsites_form_url_validation" />
                </aside>
              }
            </div>
          </div>
        </section>
        <section className="actions">
          <button className="cancel" type="button" onClick={this.onCancelButtonClick}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          <button className="done" type="submit" onClick={this.onDoneButtonClick}>
            <FormattedMessage id={showAsAdd ? "topsites_form_add_button" : "topsites_form_save_button"} />
          </button>
        </section>
      </form>
    );
  }
}

TopSiteForm.defaultProps = {
  TopSite: null,
  index: -1
};
