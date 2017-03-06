const ColorAnalyzer = require("addon/ColorAnalyzer");

exports.getColor = function getColor(dataURI, label) {
  return new Promise((resolve, reject) => {
    try {
      ColorAnalyzer.findRepresentativeColor({spec: dataURI}, (ok, number) => {
        if (ok) {
          const rgb = [(number >> 16) & 0xFF, (number >> 8) & 0xFF, number & 0xFF];
          resolve(rgb);
        } else {
          resolve(null);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};
