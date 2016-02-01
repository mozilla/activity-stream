const React = require("react");
const {connect} = require("react-redux");

const Main = (props) => {
  return (<div>
    Hello world!
  </div>);
};

function select(state) {
  return state;
}

module.exports = connect(select)(Main);
