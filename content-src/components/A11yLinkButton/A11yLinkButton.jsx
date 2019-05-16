import React from "react";

export function A11yLinkButton(props) {
  return (
    <button {...props} className="a11y-link-button">
      {props.children}
    </button>
  );
}
