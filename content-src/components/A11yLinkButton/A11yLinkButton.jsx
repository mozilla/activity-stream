import React from "react";

export function A11yLinkButton(props) {
  return (
    <button className="a11y-link-button" type="button" {...props} >
      {props.children}
    </button>
  );
}
