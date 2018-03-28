import {Button} from "../components/Button";
import React from "react";
import {SnippetBase} from "../components/SnippetBase";

const styles = {
  title: {
    display: "inline",
    fontSize: "inherit",
    margin: 0
  },
  body: {
    display: "inline",
    margin: 0
  },
  icon: {
    height: "42px",
    width: "42px",
    marginRight: "15px",
    borderRadius: "6px",
    backgroundColor: "rgba(0,0,0,0.1)",
    flexShrink: 0
  }
};

export const SimpleSnippet = props => (<SnippetBase {...props}>
  <div style={styles.icon} />
  <div>
    <h3 style={styles.title}>{props.content.title}</h3> <p style={styles.body}>{props.content.body}</p>
  </div>
  {props.content.button ? <div><Button>{props.content.button.label}</Button></div> : null}
</SnippetBase>);
