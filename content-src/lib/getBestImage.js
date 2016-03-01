const IMG_HEIGHT = 226;
const IMG_WIDTH =  124;

module.exports = function getBestImage(images) {
  if (!images || !images.length) {
    return null;
  }
  const filteredImages = images.filter(image => {
    if (!image.url) {
      return false;
    }
    if (!image.width || image.width < IMG_WIDTH) {
      return false;
    }
    if (!image.height || image.height < IMG_HEIGHT) {
      return false;
    }
    return true;
  });

  if (!filteredImages.length) {
    return null;
  }

  return filteredImages[0];
};

module.exports.IMG_HEIGHT = IMG_HEIGHT;
module.exports.IMG_WIDTH = IMG_WIDTH;
