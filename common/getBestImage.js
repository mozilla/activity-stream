module.exports = function getBestImage(images) {
  // we will always either get one, and consequently best image, or no image at all
  if (!images || !images.length) {
    return null;
  }
  return images[0];
};
