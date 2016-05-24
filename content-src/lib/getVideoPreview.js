module.exports = function getVideoPreview(site) {
  switch (site.provider_url) {
    case "https://www.youtube.com/":
      return getVideoURL.youtube(site);
    case "https://vimeo.com/":
      return getVideoURL.vimeo(site);
    default:
      return null;
  }

};

const getVideoURL = {
  youtube: function(site) {
    const youtubeIdSearch = /(v=|embed\/)([\w-]{11})\??/;
    let idMatches = site.url.match(youtubeIdSearch);
    if (!idMatches || idMatches.length < 3) {
      return null;
    }
    let videoId = idMatches[2];

    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  },

  vimeo: function(site) {
    const vimeoIdSearch = /\/([0-9]+)/;
    let idMatches = site.url.match(vimeoIdSearch);
    if (!idMatches || idMatches.length < 2) {
      return null;
    }
    let videoId = idMatches[1];

    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }
};

