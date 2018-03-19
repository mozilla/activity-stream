import React from "react";

const defaultStyles = {
  container: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px",
    backgroundColor: "white",
    fontSize: "12px",
    lineHeight: "16px",
    boxShadow: "0 -1px 4px 0 rgba(12, 12, 13, 0.1)"
  },
  innerWrapper: {
    maxWidth: "992px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center"
  },
  blockButton: {
    background: "none",
    border: 0,
    display: "block",
    position: "absolute",
    top: "50%",
    right: "24px",
    height: "16px",
    width: "16px",
    backgroundImage: "url(resource://activity-stream/data/content/assets/glyph-dismiss-16.svg)",
    opacity: 0.5,
    marginTop: "-8px",
    padding: 0
  }
};

export class SnippetBase extends React.PureComponent {
  render() {
    const {props} = this;

    // Extend default styles
    const styles = Object.assign({}, defaultStyles);
    if (props.styles) {
      Object.keys(props.styles).forEach(key => {
        styles[key] = Object.assign({}, styles[key], props.styles[key]);
      });
    }

    return (<div style={styles.container}>
      <div style={styles.innerWrapper}>
        {props.children}
      </div>
      <button style={styles.blockButton} onClick={props.onBlock} />
    </div>);
  }
}
