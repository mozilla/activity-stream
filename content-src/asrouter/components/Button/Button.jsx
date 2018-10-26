// @ts-check

/**
 * @typedef {import("./Button").ButtonProps} ButtonProps
 * @typedef {import("./Button").ButtonCustomStyles} ButtonCustomStyles
 */

import React from "react";

const ALLOWED_STYLE_TAGS = ["color", "backgroundColor"];

/**
 *  Button
 * @param {ButtonProps} props
 */
export const Button = props => {
  /** @type {ButtonCustomStyles} */
  const style = {};

  // Add allowed style tags from props, e.g. props.color becomes style={color: props.color}
  if (props.style) {
    for (const tag of ALLOWED_STYLE_TAGS) {
      if (props.style[tag]) {
        style[tag] = props.style[tag];
      }
    }
  }

  // remove border if bg is set to something custom
  if (style.backgroundColor) {
    style.border = "0";
  }

  return (<button onClick={props.onClick}
    className={props.className || "ASRouterButton"}
    style={style}>
    {props.children}
  </button>);
};
