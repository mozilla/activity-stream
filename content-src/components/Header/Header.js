const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");
const {justDispatch} = require("selectors/selectors");
const {Link} = require("react-router");
const classNames = require("classnames");

const Header = React.createClass({
  getDefaultProps() {
    return {
      links: [],
      disabled: false
    };
  },
  getInitialState() {
    return {showDropdown: false};
  },
  onClick() {
    if (this.props.disabled) {
      return;
    }
    this.setState({showDropdown: !this.state.showDropdown});
  },
  render() {
    const props = this.props;
    return (<header className="head">

      <section ref="clickElement" className={classNames("nav", {"disabled": props.disabled})} onClick={this.onClick}>
        <h1>
          <span hidden={!props.icon} className={`icon icon-spacer icon-${props.icon}`} />
          <span>{props.title}</span>
          <span ref="caret" hidden={props.disabled} className="arrow" />
        </h1>
        <ul ref="dropdown" className="nav-picker" hidden={!this.state.showDropdown}>
          {props.links.map(link => <li key={link.to}><Link to={link.to}>{link.title}</Link></li>)}
        </ul>
      </section>
      <section className="filter">
        <input
          onChange={e => props.dispatch(actions.NotifyFilterQuery(e.target.value))}
          placeholder="Search your Activity Stream"
          ref="filter"
          type="search" />
      </section>
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
  links: React.PropTypes.array,
  disabled: React.PropTypes.bool
};

module.exports = connect(justDispatch)(Header);
module.exports.Header = Header;
