const getYouTubeID = require("get-youtube-id");

const getVideoURL = {
  youtube(url) {
    let videoId = getYouTubeID(url, {fuzzy: false});
    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  },

  vimeo(url) {
    const vimeoRegex = /(http|https)?:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/;
    let idMatches = url.match(vimeoRegex);
    if (!idMatches) {
      return null;
    }
    let videoId = idMatches[idMatches.length - 1];

    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }
};

module.exports = function getVideoPreview(url) {
  if (!url) {
    return null;
  }
  return getVideoURL.youtube(url) ||
         getVideoURL.vimeo(url) ||
         null;
};
