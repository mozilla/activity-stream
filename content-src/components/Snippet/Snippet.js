const React = require("react");
const classNames = require("classnames");

/**
 * This should be a stateless, functional component.  Unfortunately, testing these kinda sucks; see
 * http://stackoverflow.com/questions/36682241/testing-functional-components-with-renderintodocument)
 * So for now, we are using PureRenderMixin.
 */
const PureRenderMixin = require("react-addons-pure-render-mixin");

const Snippet = React.createClass({
  mixins: [PureRenderMixin],
  onClose(e) {
    e.preventDefault();
    this.props.setVisibility(false);
  },
  render() {
    const {visible, description, title, image} = this.props;
    const imageAttributes = {
      className: classNames("snippet-image", {"placeholder": !image}),
      style: {backgroundImage: image ? `url(${image})` : "none"}
    };
    return (<div className={classNames("snippet", {"hide-with-fade-out": !visible})}>
      <div className="snippet-container">
        <div ref="image" {...imageAttributes} />
        <div className="snippet-text">
          {title && <h3 ref="title" className="snippet-title">{title}</h3>}
          {/*
            NOTE: This could potentially be dangerous if we end up changing
            the data source to something other than commited strings to the repo.
            We should consider sanitization/reevaluating this strategy when we
            change the data source for snippets.
          */}
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

/**
 * Snippet - A component for the New Tab page snippet
 *
 * @prop  {bool} visible        Determines whether the snippet is currently visible or not
 * @prop  {string} description  ~140 character text in the snippet
 * @prop  {string} title        Bold text at the top of the snippet
 * @prop  {func} setVisibility  Called with false when the user clicks on the 'close' button
 */
Snippet.propTypes = {
  visible: React.PropTypes.bool,
  description: React.PropTypes.string.isRequired,
  title: React.PropTypes.string,
  setVisibility: React.PropTypes.func.isRequired
};

module.exports = Snippet;
