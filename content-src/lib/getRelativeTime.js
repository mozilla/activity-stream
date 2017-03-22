const TIME = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24
};

/**
 * getRelativeTime - Computes the amount of time that has elapsed relative to another time and
 *                   determines if it should be represented in seconds, minutes, hours or days
 *
 * @param  {number} time A number representing the time
 * @return {obj}
 *     .timestampID {str} The localized ID which represents the timestamp. Can be "m" for minutes,
 *                 "h" for hours, or "d" for days. See strings.properties for values
 *     .timestampNumber {number} (optional) The amount of time computed relative to input
 */
module.exports = function getRelativeTime(time) {
  const now = new Date();
  const diff = now - time;
  const m = Math.floor((diff % TIME.h) / TIME.m);
  const h = Math.floor((diff % TIME.d) / TIME.h);
  const d = Math.floor(diff / TIME.d);
  if (diff < TIME.m) {
    return {timestampID: "time_label_less_than_minute"};
  } else if (diff < TIME.h) {
    return {timestampID: "time_label_minute", timestampNumber: m};
  } else if (diff < TIME.d) {
    return {timestampID: "time_label_hour", timestampNumber: h};
  }
  return {timestampID: "time_label_day", timestampNumber: d};
};
