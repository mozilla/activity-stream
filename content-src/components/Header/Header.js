const React = require("react");
const {Link} = require("react-router");
const {l10n} = require("lib/utils");

const Header = React.createClass({
  getDefaultProps() {
    return {links: []};
  },
  getInitialState() {
    return {showDropdown: false};
  },
  render() {
    const props = this.props;
    return (<header className="head">

      <section className="nav" onClick={() => this.setState({showDropdown: !this.state.showDropdown})}>
        <h1>
          <span hidden={!props.icon} className={`icon fa ${props.icon}`} />
          <span {...l10n(props)}>{props.title}</span>
          <span className="arrow fa fa-chevron-down" />
        </h1>
        <ul className="nav-picker" hidden={!this.state.showDropdown}>
          {props.links.map(link => <li key={link.to}><Link to={link.to} {...l10n(link)}>{link.title}</Link></li>)}
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
  title: React.PropTypes.string.isRequired,
  icon: React.PropTypes.string,
  pathname: React.PropTypes.string.isRequired,
  links: React.PropTypes.array.isRequired
};

module.exports = Header;
