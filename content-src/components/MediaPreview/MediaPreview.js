const React = require("react");
const classNames = require("classnames");

const MediaPreview = React.createClass({
  getInitialState() {
    return {
      showPlayer: false
    };
  },

  getDefaultProps() {
    return {
      previewInfo: {}
    };
  },

  onPreviewClick(evt) {
    evt.preventDefault();
    this.setState({showPlayer: true});
  },

  render() {
    const previewInfo = this.props.previewInfo;

    let player;
    if (this.state.showPlayer && previewInfo.previewURL) {
      player = (<iframe className="video-preview-player"
                        src={previewInfo.previewURL}
                        width="367"
                        height="206"
                        type="text/html"
                        ref="previewPlayer"
                        frameBorder="0"
                        allowFullScreen={true} />);
    }

    const style = previewInfo.thumbnail ? {backgroundImage: `url(${previewInfo.thumbnail.url})`} : null;
    return (<div className={classNames("video-preview", {isPlaying: this.state.showPlayer})}
                 style={style} onClick={this.onPreviewClick}>
      {player}
    </div>);
  }
});

MediaPreview.propTypes = {
  previewInfo: React.PropTypes.shape({
    previewURL: React.PropTypes.string,
    thumbnail: React.PropTypes.object,
    type: React.PropTypes.string
  })
};

module.exports = MediaPreview;
