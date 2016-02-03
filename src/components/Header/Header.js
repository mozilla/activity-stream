const React = require("react");

const Header = React.createClass({
  render() {
    const props = this.props;
    return (<header className="head">
      <section className="nav">
        Home
      </section>
      <section className="filters">
        {props.showFilter && <div className="textbox-wrap">
          <input type="text" placeholder="Filter" name="filter" />
        </div>}
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
  showFilter: React.PropTypes.bool,
};

module.exports = Header;
