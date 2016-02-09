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
        <h1>{props.currentTitle}</h1>
        <ul className="nav-picker" hidden={!this.state.showDropdown}>
          <li hidden={props.currentPath === "/"}><Link to="/">Home</Link></li>
          <li hidden={props.currentPath === "/timeline"}><Link to="/timeline">Timeline</Link></li>
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
};

module.exports = Header;
