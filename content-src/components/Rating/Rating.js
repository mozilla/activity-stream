const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");

const Rating = React.createClass({
  getInitialState() {
    return {currentRating: null};
  },
  onClick(currentIndex) {
    if (!this.state.currentRating) {
      let ratingIndex = (this.props.numStars + 1) - currentIndex;
      let {index, type} = this.props.site;
      this.setState({currentRating: ratingIndex});
      this.props.dispatch(actions.NotifyRateMetadata({rating: ratingIndex, rated_index: index, rated_type: type}));
    }
  },
  createStars() {
    let stars = [];
    for (let i = 1; i <= this.props.numStars; i++) {
      // in order for the stars to have the correct 'hover' order we apply a
      // transform: scaleX(-1) to flip them along the X axis. this allows us
      // to grab the succeeding stars.
      stars.push(<span
        ref={`star${i}`}
        id={`star-${i}`}
        className={classNames("icon icon-rating-default", {active: (this.props.numStars + 1 - i) <= this.state.currentRating})}
        onClick={() => this.onClick(i)}
        style={{transform: `translate(${((i - 1) * 25)}px)`}}
        key={i} />);
    }
    return stars;
  },
  render() {
    return (<div ref="rating" hidden={!this.props.showRating} className="rating-container">{this.createStars()}</div>);
  }
});

Rating.propTypes = {
  site: React.PropTypes.shape({
    index: React.PropTypes.number,
    type: React.PropTypes.string
  }).isRequired,
  showRating: React.PropTypes.bool,
  numStars: React.PropTypes.number
};

module.exports = connect(justDispatch)(Rating);
module.exports.Rating = Rating;
