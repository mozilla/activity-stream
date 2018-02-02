import {FormattedMessage} from "react-intl";
import React from "react";

export class TopSiteFormInput extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {validationError: this.props.validationError};
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onMount = this.onMount.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.validationError) {
      this.setState({validationError: true});
    }
  }

  onBlur() {
    if (this.props.validate) {
      const value = this.props.clean ? this.props.clean(this.props.value) : this.props.value;
      if (!this.props.validate(value)) {
        this.setState({validationError: true});
      } else {
        this.setState({validationError: false});
      }
    }
  }

  onFocus() {
    this.setState({validationError: false});
  }

  onMount(input) {
    this.input = input;
  }

  render() {
    const showClearButton = !this.props.loading && this.props.value && this.props.onClear;

    return (<label><FormattedMessage id={this.props.titleId} />
      <div className={`field url${this.state.validationError ? " invalid" : ""}`}>
        {this.props.loading && <div className="loading-container">
            <div className="loading-animation" />
          </div>}
        {showClearButton &&
          <div className="clear-screenshot-input" onClick={this.props.onClear} />}
        <input type="text"
          value={this.props.value}
          onBlur={this.onBlur}
          ref={this.onMount}
          onFocus={this.onFocus}
          onChange={this.props.onChange}
          placeholder={this.props.intl.formatMessage({id: this.props.placeholderId})} />
        {this.state.validationError &&
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
