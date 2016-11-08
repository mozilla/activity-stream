const React = require("react");
const {storiesOf} = require("@kadira/storybook");
const {Loader} = require("components/Loader/Loader");

const LoaderContainer = React.createClass({
  // This is a replacement for what would normally be handled by redux
  render() {
    return (
      <div style={{padding: 30}}>
        <Loader
          title="Be on the lookout"
          body="Really cool stuff will show up here, let me tell you!"
          label="Sit tight"
          show={true} centered={true} />
      </div>
    );
  }
});

module.exports = LoaderContainer;

storiesOf("Loader", module)
  .add("Basic example", () => <LoaderContainer />);
