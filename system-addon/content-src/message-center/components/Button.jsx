import React from "react";

const styles = {
  button: {
    whiteSpace: "nowrap",
    borderRadius: "4px",
    border: "1px solid var(--newtab-border-secondary-color)",
    backgroundColor: "var(--newtab-button-secondary-color)",
    fontFamily: "inherit",
    padding: "8px 15px",
    marginLeft: "12px",
    color: "inherit"
  }
};

export const Button = props => (<a href={props.url} onClick={props.onClick} style={styles.button}>{props.children}</a>);
