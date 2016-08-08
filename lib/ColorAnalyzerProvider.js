const {Cu, Cc, Ci} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");

const ColorAnalyzer = Cc["@mozilla.org/places/colorAnalyzer;1"].
  getService(Ci.mozIColorAnalyzer);

exports.getColor = function getColor(url) {
  return new Promise((resolve, reject) => {
    ColorAnalyzer.findRepresentativeColor({spec: url}, function(ok, number) {
      if (ok) {
        const rgb = [(number >> 16) & 0xFF, (number >> 8) & 0xFF, number & 0xFF];
        resolve(rgb);
      } else {
        reject(new Error("There was an error processing this image"));
      }
    });
  });
};
