import {FormattedMessage} from "react-intl";
import React from "react";

export function A11yLinkButton(props) {
  return (
    <button {...props} className="a11y-link-button">
      {props.children}
      <FormattedMessage id="topsites_form_use_image_link" />
    </button>
  );
}
