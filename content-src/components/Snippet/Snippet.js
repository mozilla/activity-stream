const React = require("react");
const classNames = require("classnames");

const Snippet = React.createClass({
  onClose(e) {
    e.preventDefault();
    this.props.setVisibility(false);
  },
  render() {
    const {visible, description, title, image} = this.props;
    return (<div className={classNames("snippet", {"hidden": !visible})}>
      <div className="snippet-container">
        <div ref="image" className={classNames("snippet-image", {"placeholder": !image})} style={{backgroundImage: image ? `url(${image})` : "none"}} />
        <div className="snippet-text">
          <h3 ref="title" hidden={!title} className="snippet-title">{title}</h3>
          <p
            dangerouslySetInnerHTML={{__html: description}} // eslint-disable-line react/no-danger
            className="snippet-description"
            ref="description" />
        </div>
      </div>
      <button ref="closeButton" className="snippet-close-button" onClick={this.onClose}>
        <span className="icon icon-dismiss" />
        <span className="sr-only">Close snippet</span>
      </button>
    </div>);
  }
});

Snippet.propTypes = {
  visible: React.PropTypes.bool,
  description: React.PropTypes.string.isRequired,
  title: React.PropTypes.string,
  setVisibility: React.PropTypes.func.isRequired
};

module.exports = Snippet;
