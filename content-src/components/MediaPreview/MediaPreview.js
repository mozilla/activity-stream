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
      site: {},
      height: null,
      width: null,
      type: "",
      thumbnail: null,
      previewURL: null
    };
  },

  onPreviewClick(evt) {
    evt.preventDefault();
    this.setState({showPlayer: true});
  },

  render() {
    const site = this.props.site;

    let player;
    if (this.state.showPlayer) {
      player = (<iframe className="video-preview-player" width="367" height="206" type="text/html" src={site.previewURL} frameborder="0" allowFullScreen></iframe>);
    }

    const style = {backgroundImage: `url(${site.thumbnail.url})`};
    return (<div className={classNames("video-preview", {isPlaying: this.state.showPlayer})}
                 style={style} onClick={this.onPreviewClick}>
      {player}
    </div>);
  }
});

module.exports = MediaPreview;
