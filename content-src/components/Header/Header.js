const React = require("react");
const {Link} = require("react-router");

const Header = React.createClass({
  getInitialState() {
    return {showDropdown: false};
  },
  render() {
    const props = this.props;
    const currentRoute = props.currentRoute || {};
    return (<header className="head" hidden={currentRoute.path === "/"}>

      <section className="nav" onClick={() => this.setState({showDropdown: !this.state.showDropdown})}>
        <h1>
          <span hidden={!currentRoute.icon} className={`icon fa ${currentRoute.icon}`} />
          <span>{currentRoute.title}</span>
          <span className="arrow fa fa-chevron-down" />
        </h1>
        <ul className="nav-picker" hidden={!this.state.showDropdown}>
          <li hidden={currentRoute.path === "/"}><Link to="/">Home</Link></li>
          <li hidden={currentRoute.path === "/timeline"}><Link to="/timeline">Activity Stream</Link></li>
        </ul>
      </section>
      <section className="spacer" />
      <section className="user-info">
        {props.userName && <span>
          {props.userName}
        </span>}
        {props.userImage && <img alt=""
          src={props.userImage} />}
      </section>
    </header>);
  }
});

Header.propTypes = {
  userName: React.PropTypes.string,
  userImage: React.PropTypes.string,
  currentRoute: React.PropTypes.shape({
    title: React.PropTypes.string.isRequired,
    icon: React.PropTypes.string,
    path: React.PropTypes.string.isRequired
  }).isRequired
};

module.exports = Header;
