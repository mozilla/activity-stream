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
      validationError: false,
      customScreenshotUrl: site ? site.customScreenshotURL : "",
      showCustomScreenshotForm: site ? site.customScreenshotURL : false,
      screenshotRequestFailed: false,
      screenshotPreview: null,
      pendingScreenshotUpdate: false
    };
    this.onClearScreenshotInput = this.onClearScreenshotInput.bind(this);
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onClearUrlClick = this.onClearUrlClick.bind(this);
    this.onDoneButtonClick = this.onDoneButtonClick.bind(this);
    this.onCustomScreenshotUrlChange = this.onCustomScreenshotUrlChange.bind(this);
    this.onPreviewButtonClick = this.onPreviewButtonClick.bind(this);
    this.onEnableScreenshotUrlForm = this.onEnableScreenshotUrlForm.bind(this);
    this.validateUrl = this.validateUrl.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.screenshotPreview && this.state.pendingScreenshotUpdate) ||
        nextProps.screenshotRequestFailed) {
      this.setState({
        pendingScreenshotUpdate: false,
        screenshotRequestFailed: nextProps.screenshotRequestFailed,
        screenshotPreview: nextProps.screenshotPreview
      });
    }
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

  onEnableScreenshotUrlForm() {
    this.setState({showCustomScreenshotForm: true});
  }

  onCustomScreenshotUrlChange(event) {
    this.setState({
      customScreenshotUrl: event.target.value,
      pendingScreenshotUpdate: false,
      validationError: false,
      screenshotRequestFailed: false,
      screenshotPreview: null
    });
  }

  onClearScreenshotInput() {
    this.setState({
      customScreenshotUrl: "",
      validationError: false,
      screenshotRequestFailed: false,
      screenshotPreview: null
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

      if (this.state.customScreenshotUrl) {
        site.customScreenshotURL = this.cleanUrl(this.state.customScreenshotUrl);
      } else if (this.props.site && this.props.site.customScreenshotURL) {
        // Used to flag that previously cached screenshot should be removed
        site.customScreenshotURL = null;
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

  onPreviewButtonClick(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.setState({pendingScreenshotUpdate: true});

      this.props.dispatch(ac.OnlyToMain({
        type: at.PREVIEW_REQUEST,
        data: {customScreenshotURL: this.cleanUrl(this.state.customScreenshotUrl)}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "PREVIEW_REQUEST"
      }));
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

  validateCustomScreenshotUrl() {
    const {customScreenshotUrl} = this.state;
    return customScreenshotUrl ? this.validateUrl(customScreenshotUrl) : true;
  }

  validateForm() {
    const validate = this.validateUrl(this.state.url) && this.validateCustomScreenshotUrl();

    if (!validate) {
      this.setState({validationError: true});
    }

    return validate;
  }

  _renderCustomScreenshotInput() {
    const validationError = this.state.validationError &&
      (this.state.screenshotRequestFailed || !this.validateCustomScreenshotUrl());
    // Set focus on error if the url field is valid or when the input is first rendered and is empty
    const shouldFocus = (validationError && this.validateUrl(this.state.url)) || !this.state.customScreenshotUrl;

    if (!this.state.showCustomScreenshotForm) {
      return (<a href="" className="enable-custom-image-input" onClick={this.onEnableScreenshotUrlForm}>
        <FormattedMessage id="topsites_form_image_enable_button" />
      </a>);
    }
    return (<div className="custom-image-input-container">
      <TopSiteFormInput
        errorMessageId={this.props.screenshotRequestFailed ? "topsites_form_image_validation" : "topsites_form_url_validation"}
        loading={this.state.pendingScreenshotUpdate}
        onChange={this.onCustomScreenshotUrlChange}
        onClear={this.onClearScreenshotInput}
        shouldFocus={shouldFocus}
        typeUrl={true}
        value={this.state.customScreenshotUrl}
        validationError={validationError}
        titleId="topsites_form_image_label"
        placeholderId="topsites_form_image_placeholder"
        intl={this.props.intl} />
    </div>);
  }

  _getPreviewScreenshot() {
    return Object.assign({}, this.props.site, {
      screenshotPreview: this.state.screenshotPreview,
      screenshotRequestFailed: this.state.screenshotRequestFailed
    });
  }

  render() {
    const {customScreenshotUrl} = this.state;
    // For UI purposes, editing without an existing link is "add"
    const showAsAdd = !this.props.site;
    const changedCustomScreenshotUrl = customScreenshotUrl &&
      (showAsAdd || (this.props.site.customScreenshotURL !== this.cleanUrl(customScreenshotUrl)));
    // Preview mode enables the preview button and prevents saving or adding a topsite.
    const previewMode = (changedCustomScreenshotUrl && !this.state.screenshotPreview) ||
      this.state.screenshotRequestFailed;
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
                shouldFocus={this.state.validationError && !this.validateUrl(this.state.url)}
                value={this.state.url}
                onClear={this.onClearUrlClick}
                validationError={this.state.validationError && !this.validateUrl(this.state.url)}
                titleId="topsites_form_url_label"
                typeUrl={true}
                placeholderId="topsites_form_url_placeholder"
                errorMessageId="topsites_form_url_validation"
                intl={this.props.intl} />
              {this._renderCustomScreenshotInput()}
            </div>
            <TopSiteLink link={this._getPreviewScreenshot()}
              defaultStyle={this.state.screenshotRequestFailed}
              title={this.state.label} />
          </div>
        </div>
        <section className="actions">
          <button className="cancel" type="button" onClick={this.onCancelButtonClick}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          {previewMode ?
            <button className="done preview" type="submit" onClick={this.onPreviewButtonClick}>
              <FormattedMessage id="topsites_form_preview_button" />
            </button> :
            <button className="done" type="submit" onClick={this.onDoneButtonClick}>
              <FormattedMessage id={showAsAdd ? "topsites_form_add_button" : "topsites_form_save_button"} />
            </button>}
        </section>
      </form>
    );
  }
}

TopSiteForm.defaultProps = {
  site: null,
  index: -1
};
