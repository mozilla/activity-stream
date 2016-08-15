const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");

const Rating = React.createClass({
  getInitialState() {
    return {numStars: 5, activeRatings: {}, currentRating: null};
  },
  onClick(index) {
    if (!this.state.currentRating) {
      let ratingIndex = (this.state.numStars + 1) - index;
      for (let i = this.state.numStars; i >= index; i--) {
        this.setState(prevState => {prevState.activeRatings[i] = true;});
      }
      this.setState({currentRating: ratingIndex});
      this.props.dispatch(actions.NotifyRateMetadata({rating: ratingIndex, rated_url: this.props.site.url}));
    }
  },
  createStars() {
    let stars = [];
    for (let i = 1; i <= this.state.numStars; i++) {
      stars.push(<span
        id={`star-${i}`}
        className={classNames("icon icon-rating-default", {active: this.state.activeRatings[i]})}
        onClick={() => this.onClick(i)}
        style={{transform: `translate(${((i - 1) * 25)}px)`}}
        key={i} />);
    }
    return stars;
  },
  render() {
    return (<div hidden={!this.props.showRating} className="rating-container">{this.createStars()}</div>);
  }
});

Rating.propTypes = {
  site: React.PropTypes.shape({url: React.PropTypes.string.isRequired}).isRequired,
  showRating: React.PropTypes.bool
};

module.exports = connect(justDispatch)(Rating);
