const urlParse = require("url-parse");

const ALLOWED_QUERY_PARAMS = new Set(["id", "p", "q", "query", "s", "search", "sitesearch"]);
const REMOVE_KEYS = ["auth", "password", "username"];
const RANDOM_COLORS = [
  [242, 88, 32], // orange
  [234, 56, 95], // magenta
  [255, 146, 23], // light orange
  [88, 189, 53], // green
  [122, 47, 122], // purple
  [212, 212, 212], // grey
  [217, 34, 21], // red
  [7, 123, 215], // blue
  [17, 117, 177], // darker blue
  [2, 189, 173] // teal
];

module.exports = {
  RANDOM_COLORS,

  toRGBString(...color) {
    const name = color.length === 4 ? "rgba" : "rgb";
    return `${name}(${color.join(", ")})`;
  },

  getBlackOrWhite(r, g, b) {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "black" : "white";
  },

  getRandomColor(key) {
    if (key && typeof key === "number") {
      return RANDOM_COLORS[key % 10];
    }  else if (key && typeof key === "string") {
      return RANDOM_COLORS[key.charCodeAt(0) % 10];
    } else {
      return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
    }
  },

  prettyUrl(url) {
    if (!url) {
      return "";
    }
    return url.replace(/^((https?:)?\/\/)?(www\.)?/i, "").toLowerCase();
  },

  sanitizeUrl(site) {
    if (!site) {
      return "";
    }

    const parsedUrl = (typeof site === "string") ? urlParse(site, true) : site.parsedUrl;
    const safeQueryParams = {};

    if (!parsedUrl) {
      return "";
    }

    // Remove any unwanted username/password from the parsed URL.
    REMOVE_KEYS.forEach((key) => parsedUrl.set(key, ""));

    // Filter out the allowed query params from the specified URL and update the
    // query string.
    Object.keys(parsedUrl.query)
      .filter((param) => ALLOWED_QUERY_PARAMS.has(param))
      .forEach((param) => safeQueryParams[param] = parsedUrl.query[param]);

    parsedUrl.set("query", safeQueryParams);

    // If there was not a specified protocol (ie: //mozilla.com), specify HTTPS.
    if (!parsedUrl.protocol) {
      parsedUrl.set("protocol", "https:");
    }

    return parsedUrl.toString();
  },

  getRandomFromTimestamp(percent, site) {
    const n = (site.lastVisitDate || site.bookmarkDateCreated || Math.round(Math.random() * 100)) % 100;
    return n <= percent * 100;
  }
};
