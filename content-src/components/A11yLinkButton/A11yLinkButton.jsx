import React from "react";

export function A11yLinkButton(props) {
  return (
    <button type="button" {...props} className="a11y-link-button">
      {props.children}
    </button>
  );
}

// function for merging classes, if necessary
// let className = "a11y-link-button";
// if (props.className) {
//   className += ` ${props.className}`;
// }
