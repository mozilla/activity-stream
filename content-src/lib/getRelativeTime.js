const moment = require("moment");

// Custom relative time
// We can only have one instance of moment :(
moment.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "<1m",
    m: "%dm",
    mm: "%dm",
    h: "%dh",
    hh: "%dh",
    d: "%dd",
    dd: "%dd",
    M: "%dM",
    MM: "%dM",
    y: "%dy",
    yy: "%dy"
  }
});

module.exports = unixTimestamp => moment(unixTimestamp).fromNow();
