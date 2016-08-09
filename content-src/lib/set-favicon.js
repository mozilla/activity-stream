// This function sets the favicon of the current page
module.exports = function setFavicon(filePath) {
  const iconEl = document.head.querySelector("link[rel='icon']");
  if (!iconEl) {
    return;
  }
  iconEl.href = iconEl.href.replace(/img\/.+$/, "img/" + filePath);
};
