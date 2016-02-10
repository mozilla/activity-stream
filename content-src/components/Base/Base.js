const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("actions/action-manager");

const Header = require("components/Header/Header");

const Base = React.createClass({
  componentDidMount() {
    // This should work!
    this.props.dispatch(actions.RequestTopFrecent());

    // This should fail, since nothing is implemented on the Firefox side
    this.props.dispatch(actions.RequestBookmarks());
  },
  render() {
    const props = this.props;
    const currentRoute = {
      path: props.location.pathname,
      title: props.routes[props.routes.length - 1].title,
      icon: props.routes[props.routes.length - 1].icon
    };
    return (<div id="base">
      <Header
        userName="Luke Skywalker"
        userImage="https://cdninfinity-a.akamaihd.net/infinitycdn/web/assets/assets/images/icons/og_images/fb/character_luke-skywalker_img1.jpg"
        currentRoute={currentRoute}
      />
      {props.children}
    </div>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(Base);
