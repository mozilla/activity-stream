import {FormattedMessage} from "react-intl";
import React from "react";

export class TopSiteFormInput extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMount = this.onMount.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.validationError) {
      this.input.focus();
    }
  }

  onMount(input) {
    this.input = input;
  }

  render() {
    const showClearButton = !this.props.loading && this.props.value && this.props.onClear;

    return (<label><FormattedMessage id={this.props.titleId} />
      <div className={`field url${this.props.validationError ? " invalid" : ""}`}>
        {this.props.loading && <div className="loading-container">
            <div className="loading-animation" />
          </div>}
        {showClearButton &&
          <div className="clear-input-value" onClick={this.props.onClear} />}
        <input type="text"
          value={this.props.value}
          ref={this.onMount}
          onChange={this.props.onChange}
          placeholder={this.props.intl.formatMessage({id: this.props.placeholderId})} />
        {this.props.validationError &&
          <aside className="error-tooltip">
            <FormattedMessage id={this.props.errorMessageId} />
          </aside>}
      </div>
    </label>);
  }
}

TopSiteFormInput.defaultProps = {
  loading: false,
  showClearButton: false,
  value: "",
  validationError: false
};
