const React = require("react");
const {storiesOf} = require("@kadira/storybook");
const ContextMenu = require("components/ContextMenu/ContextMenu");

const DEFAULT_OPTIONS = [
  {label: "Apples", onClick: () => {}},
  {label: "Oranges", onClick: () => {}},
  {label: "Grapes", onClick: () => {}}
];

// This is so we can show the context menu
const ContextMenuContainer = React.createClass({
  getInitialState() {
    return {visible: true};
  },
  render() {
    const style = {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 150,
      height: 60,
      border: "1px dashed #DDD"
    };
    const buttonStyle = {
      fontSize: 11,
      display: "inline-block"
    };
    return (<div style={style}>
      <ContextMenu
        options={this.props.options}
        visible={this.state.visible}
        onUpdate={visible => this.setState({visible})} />
      <button style={buttonStyle} onClick={() => this.setState({visible: !this.state.visible})}>Toggle menu</button>
    </div>);
  }
});

storiesOf("ContextMenu", module)
  .add("default props", () => (
    <ContextMenuContainer options={DEFAULT_OPTIONS} />
  ));
