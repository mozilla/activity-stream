import React from "react";

const styles = {
  button: {
    border: 0,
    backgroundColor: "#e1e1e2",
    fontFamily: "inherit",
    padding: "8px 15px",
    marginLeft: "15px"
  }
};

export const Button = props => (<a href={props.url} onClick={props.onClick} style={styles.button}>{props.children}</a>);
