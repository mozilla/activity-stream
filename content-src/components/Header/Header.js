const React = require("react");
const {Link} = require("react-router");

const Header = React.createClass({
  getInitialState() {
    return {showDropdown: false};
  },
  render() {
    const props = this.props;
    return (<header className="head">
      <section className="nav" onClick={() => this.setState({showDropdown: !this.state.showDropdown})}>
        <h1>
          <span hidden={!props.currentRoute.icon} className={`icon fa ${props.currentRoute.icon}`} />
          <span>{props.currentRoute.title}</span>
          <span className="arrow fa fa-chevron-down" />
        </h1>
        <ul className="nav-picker" hidden={!this.state.showDropdown}>
          <li hidden={props.currentRoute.path === "/"}><Link to="/">Home</Link></li>
          <li hidden={props.currentRoute.path === "/timeline"}><Link to="/timeline">Timeline</Link></li>
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
  })
};

module.exports = Header;
