const React = require("react");
const {connect} = require("react-redux");

const Header = require("components/Header/Header");

const Main = React.createClass({
  render() {
    const props = this.props;
    return (<div>
      <Header
        userName="Luke Skywalker"
        userImage="https://cdninfinity-a.akamaihd.net/infinitycdn/web/assets/assets/images/icons/og_images/fb/character_luke-skywalker_img1.jpg"
        showFilter="true"
      />
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
