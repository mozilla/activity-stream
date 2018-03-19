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

export const Button = props => (<button style={styles.button} {...props}>
  {props.children}
</button>);
