import React from "react";

export default function A11yLinkButton(props) {
  return (
    <button {...props}>
      {props.children}
    </button>
  );
}
