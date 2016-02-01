const React = require("react");
const {connect} = require("react-redux");

const Main = React.createClass({
  render() {
    const props = this.props;
    return (<div>
      Hello world!

      <pre>
      {JSON.stringify(props.Sites.frecent, null, 2)}
      
      {JSON.stringify(props.Sites.changes, null, 2)}
      </pre>
    </div>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(Main);
