import {FormattedMessage} from "react-intl";
import React from "react";

export class TopSiteFormInput extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {validationError: this.props.validationError};
    this.onChange = this.onChange.bind(this);
    this.onMount = this.onMount.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.shouldFocus && !this.props.shouldFocus) {
      this.input.focus();
    }
    if (nextProps.validationError && !this.props.validationError) {
      this.setState({validationError: true});
    }
  }

  onChange(ev) {
    if (this.state.validationError) {
      this.setState({validationError: false});
    }
    this.props.onChange(ev);
  }

  onMount(input) {
    this.input = input;
  }

  render() {
    const showClearButton = this.props.value && this.props.onClear;
    const {typeUrl} = this.props;
    const {validationError} = this.state;

    return (<label><FormattedMessage id={this.props.titleId} />
      <div className={`field ${typeUrl ? "url" : ""}${validationError ? " invalid" : ""}`}>
        {this.props.loading && <div className="loading-container">
          <div className="loading-animation" />
        </div>}
        {!this.props.loading && showClearButton &&
          <div className="icon icon-clear-input" onClick={this.props.onClear} />}
        <input type="text"
          value={this.props.value}
          ref={this.onMount}
          onChange={this.onChange}
          placeholder={this.props.intl.formatMessage({id: this.props.placeholderId})}
          autoFocus={this.props.shouldFocus} />
        {validationError &&
          <aside className="error-tooltip">
            <FormattedMessage id={this.props.errorMessageId} />
          </aside>}
      </div>
    </label>);
  }
}

TopSiteFormInput.defaultProps = {
  showClearButton: false,
  value: "",
  validationError: false
};
