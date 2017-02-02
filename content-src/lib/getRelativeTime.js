const TIME = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24
};

module.exports = function getRelativeTime(t) {
  const now = new Date();
  const diff = now - t;
  const m = Math.floor((diff % TIME.h) / TIME.m);
  const h = Math.floor((diff % TIME.d) / TIME.h);
  const d = Math.floor(diff / TIME.d);
  if (diff < TIME.m) {
    return {timestampID: "less_than_minute_label"};
  }
  else if (diff < TIME.h) {
    return {timestampID: "minute_label", timestampNumber: m};
  }
  else if (diff < TIME.d) {
    return {timestampID: "hour_label", timestampNumber: h};
  }
  return {timestampID: "day_label", timestampNumber: d};
};
