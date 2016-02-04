const React = require("react");

const Header = React.createClass({
  render() {
    const props = this.props;
    return (<header className="head">
      <section className="nav">
        <h1>Home</h1>
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
};

module.exports = Header;
