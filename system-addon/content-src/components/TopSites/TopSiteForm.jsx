import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {FormattedMessage} from "react-intl";
import React from "react";
import {TOP_SITES_SOURCE} from "./TopSitesConstants";
import {TopSiteFormInput} from "./TopSiteFormInput";
import {TopSiteLink} from "./TopSite";

export class TopSiteForm extends React.PureComponent {
  constructor(props) {
    super(props);
    const {site} = props;
    this.state = {
      label: site ? (site.label || site.hostname) : "",
      url: site ? site.url : "",
      validationError: false
    };
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onClearUrlClick = this.onClearUrlClick.bind(this);
    this.onDoneButtonClick = this.onDoneButtonClick.bind(this);
  }

  onLabelChange(event) {
    this.setState({"label": event.target.value});
  }

  onUrlChange(event) {
    this.setState({
      url: event.target.value,
      validationError: false
    });
  }

  onClearUrlClick() {
    this.setState({
      url: "",
      validationError: false
    });
  }

  onCancelButtonClick(ev) {
    ev.preventDefault();
    this.props.onClose();
  }

  onDoneButtonClick(ev) {
    ev.preventDefault();

    if (this.validateForm()) {
      const site = {url: this.cleanUrl(this.state.url)};
      const {index} = this.props;
      if (this.state.label !== "") {
        site.label = this.state.label;
      }

      this.props.dispatch(ac.AlsoToMain({
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

  cleanUrl(url) {
    // If we are missing a protocol, prepend http://
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      return `http://${url}`;
    }
    return url;
  }

  validateUrl(url) {
    try {
      return !!new URL(this.cleanUrl(url));
    } catch (e) {
      return false;
    }
  }

  validateForm() {
    const validate = this.validateUrl(this.state.url);
    this.setState({validationError: !validate});
    return validate;
  }

  render() {
    // For UI purposes, editing without an existing link is "add"
    const showAsAdd = !this.props.site;

    return (
      <form className="topsite-form">
        <div className="form-input-container">
          <h3 className="section-title">
            <FormattedMessage id={showAsAdd ? "topsites_form_add_header" : "topsites_form_edit_header"} />
          </h3>
          <div className="fields-and-preview">
            <div className="form-wrapper">
              <TopSiteFormInput onChange={this.onLabelChange}
                value={this.state.label}
                titleId="topsites_form_title_label"
                placeholderId="topsites_form_title_placeholder"
                intl={this.props.intl} />
              <TopSiteFormInput onChange={this.onUrlChange}
                value={this.state.url}
                onClear={this.onClearUrlClick}
                validationError={this.state.validationError}
                titleId="topsites_form_url_label"
                typeUrl={true}
                placeholderId="topsites_form_url_placeholder"
                errorMessageId="topsites_form_url_validation"
                intl={this.props.intl} />
            </div>
            <TopSiteLink link={this.props.site || {}} title={this.state.label} />
          </div>
        </div>
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
