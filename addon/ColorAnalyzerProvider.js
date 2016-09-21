const {Cu} = require("chrome");
const ColorAnalyzer = require("addon/ColorAnalyzer");
Cu.import("resource://gre/modules/Services.jsm");

exports.getColor = function getColor(dataURI, label) {
  return new Promise((resolve, reject) => {
    try {
      ColorAnalyzer.findRepresentativeColor({spec: dataURI}, (ok, number) => {
        if (ok) {
          const rgb = [(number >> 16) & 0xFF, (number >> 8) & 0xFF, number & 0xFF];
          resolve(rgb);
        } else {
          reject(new Error(`There was an error processing ${label}`));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};
