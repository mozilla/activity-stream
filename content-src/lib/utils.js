module.exports = {
  toRGBString(...color) {
    const name = color.length === 4 ? "rgba" : "rgb";
    return `${name}(${color.join(", ")})`;
  },
  getBlackOrWhite(r, g, b) {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "black" : "white";
  },
  prettyUrl(url) {
    if (!url) {
      return "";
    }
    return url.replace(/^https?:\/\/(www\.)?/i, "");
  }
};
