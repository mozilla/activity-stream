const React = require("react");
const {storiesOf, action} = require("@kadira/storybook");
const {Hint} = require("components/Hint/Hint");

const logAction = action("redux action");
const Container = React.createClass({
  getInitialState: () => ({disabled: false}),
  // This is a replacement for what would normally be handled by redux
  dispatch(a) {
    logAction(a);
    this.setState({disabled: true});
  },
  render() {
    return (<div style={{padding: 30}}>
      Something <Hint id="foo" title="Something" body="This is something." disabled={this.state.disabled} dispatch={this.dispatch} />
    </div>);
  }
});

module.exports = Container;

storiesOf("Hint", module)
  .add("Basic example", () => <Container />);
