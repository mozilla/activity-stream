import React from "react";
import {SimpleSnippet} from "../SimpleSnippet/SimpleSnippet";

export class EOYSnippet extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * setFrequencyValue - `frequency` form parameter value should be `monthly`
   *                     if `monthly-checkbox` is selected or `single` otherwise
   */
  setFrequencyValue() {
    const frequencyCheckbox = this.refs.form.querySelector("#monthly-checkbox");
    if (frequencyCheckbox.checked) {
      this.refs.form.querySelector("[name='frequency']").value = "monthly";
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setFrequencyValue();
    this.refs.form.submit();
  }

  renderDonations() {
    const fieldNames = ["first", "second", "third", "fourth"];
    const numberFormat = new Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency: this.props.content.currency_code,
      minimumFractionDigits: 0,
    });
    // Default to `second` button
    const selected_button = this.props.content.selected_button || 2;
    const btnStyle = {
      color: this.props.content.button_color,
      backgroundColor: this.props.content.button_background_color,
    };

    return (<form className="EOYSnippetForm" action={this.props.content.form_action} method={this.props.method} onSubmit={this.handleSubmit} ref="form">
      {fieldNames.map((field, idx) => {
        const amount = this.props.content[`donation_amount_${field}`];
        return (<React.Fragment key={idx}>
            <input type="radio" name="amount" value={amount} id={field} defaultChecked={idx + 1 === selected_button} />
            <label htmlFor={field} className="donation-amount">
              {numberFormat.format(amount)}
            </label>
          </React.Fragment>);
      })}

      <div className="monthly-checkbox-container">
        <input id="monthly-checkbox" type="checkbox" />
        <label htmlFor="monthly-checkbox">
          {this.props.content.monthly_checkbox_label_text}
        </label>
      </div>

      <input type="hidden" name="frequency" value="single" />
      <input type="hidden" name="currency" value={this.props.content.currency_code} />
      <input type="hidden" name="presets" value={fieldNames.map(field => this.props.content[`donation_amount_${field}`])} />
      <button style={btnStyle} type="submit" className="donation-form-url">{this.props.content.button_label}</button>
    </form>);
  }

  render() {
    const textStyle = {
      color: this.props.content.text_color,
      backgroundColor: this.props.content.background_color,
    };
    return <SimpleSnippet {...this.props} textStyle={textStyle} richText={this.props.richText} extraContent={this.renderDonations()} />;
  }
}
