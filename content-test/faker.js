const faker = require("faker");
const moment = require("moment");
const tiptop = require("tippy-top-sites");
const {selectSpotlight} = require("selectors/selectors");

const BASE_TIP_TOP_FAVICON_URL = "favicons/images/";

faker.timestamp = () => moment().unix();

let base_tip_top_favicon_prefix = "";

faker.internet.rgbColor = () => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(faker.internet.color());
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
};

function arrayOf(mapFn, size) {
  return Array(...Array(size)).map(mapFn);
}

function createColor(color) {
  return {
    "color": color || faker.internet.rgbColor(),
    "weight": 0.3051757812
  };
}

function createImage() {
  return {
    "caption": null,
    "url": `${faker.image.imageUrl()}?r=${faker.random.uuid()}`,
    "height": 640,
    "width": 480,
    "colors": [createColor()],
    "entropy": 1.2698034041000001
  };
}

const CREATE_SITE_DEFAULTS = {
  images: 1,
  override: null,
  type: "history",
  hasBookmark: false
};

// Options:
// date
// type
// images
// hasBookmark
// isRecommended
// override
function createSite(optional = {}) {
  let options = Object.assign({}, CREATE_SITE_DEFAULTS, optional);

  const date = options.moment || moment().subtract(10, "seconds");

  // Create the basic structure
  const name = faker.company.companyName();

  // TODO: make this optional
  const tiptopSite = faker.random.arrayElement(tiptop);

  const site = {
    // This is stuff from Firefox
    "bookmarkDateCreated": null,
    "bookmarkGuid": null,
    "favicon": "data:image/png;base64,iVBORw0KGgoAA",
    "title": tiptopSite.title || `${name} - ${faker.company.catchPhrase()}`,
    "url": tiptopSite.url || faker.internet.url(),
    "provider_display": `${name}.com`,
    "lastVisitDate": date.valueOf(),
    "frecency": faker.random.number({min: 10, max: 2000}),
    "type": options.type,
    "guid": faker.random.uuid(),

    // This is embedly
    "description": faker.lorem.sentences(),
    "favicon_url": base_tip_top_favicon_prefix + BASE_TIP_TOP_FAVICON_URL + tiptopSite.image_url ||
                   faker.image.imageUrl(),
    "media": {},
    "provider_name": name,
    "metadata_source": "EmbedlyTest"
  };

  if (options.override) {
    Object.assign(site, options.override);
  }

  if (options.isRecommended) {
    site.recommended = true;
  }

  // Add images if options.images > 0
  if (options.images) {
    site.images = arrayOf(createImage, options.images);
  }

  // Only create favicon_colors if there is a favicon_url
  if (site.favicon_url && tiptopSite.background_color_rgb) {
    site.favicon_colors = [createColor(tiptopSite.background_color_rgb)];
  }
  if (site.favicon_url && options.favicon_colors) {
    site.favicon_colors = arrayOf(createColor, options.favicon_colors);
  }

  if (options.hasBookmark || site.type === "bookmark") {
    site.bookmarkDateCreated = date.add(1, "seconds").valueOf();
    site.bookmarkGuid = `${faker.random.number()}`;
  }

  if (site.type === "bookmark") {
    site.bookmarkId = faker.random.number();
    site.bookmarkTitle = faker.company.bs();
    site.lastVisitDate = date.add(1, "seconds").valueOf();
    site.lastModified = date.add(1, "seconds").valueOf();
  }

  // Apply overrides again in case we overwrote them
  if (options.override) {
    Object.assign(site, options.override);
  }

  return site;
}

function createSpotlightItem(options = {}) {
  if (!options.images) {
    options.images = 1;
  }
  const site = createSite(options);
  return selectSpotlight({
    Highlights: {rows: [site]},
    WeightedHighlights: {rows: [site]},
    Experiments: {values: {}},
    Prefs: {prefs: {}}
  }).rows[0];
}

function range(min, max, increment = 1) {
  const result = [];
  for (let i = min; i <= max; i += increment) {
    result.push(i);
  }
  return result;
}

function createWeightedArray(weights) {
  let all = [];
  weights.forEach(item => {
    for (let i = 0; i < item.weight; i++) {
      all.push(item);
    }
  });
  return all;
}

function randomWeighter(weights) {
  const pick = faker.random.arrayElement(createWeightedArray(weights));
  if (typeof pick.value !== "undefined") {
    return pick.value;
  }
  if (pick.values) {
    return faker.random.arrayElement(pick.values);
  }
  if (pick.range) {
    return faker.random.arrayElement(range(...pick.range));
  }
  return undefined;
}

function createRows({
  length = 20,
  minPauseInSeconds = 0,
  maxPauseInSeconds = 1200,
  type = "history",
  beforeDate = Date.now().valueOf(),
  images = null
} = {}) {
  const rows = [];
  const m = moment(beforeDate, "x");

  let earliestTime = 5;
  for (let i = 0; i < length; i++) {
    // Add a random number of seconds
    const secondsToAdd = faker.random.number({min: minPauseInSeconds, max: minPauseInSeconds + maxPauseInSeconds});
    rows.push(createSite({
      type,
      images: images || randomWeighter([{weight: 1, value: 0}, {weight: 5, range: [1, 5]}]),
      moment: m.subtract(earliestTime + secondsToAdd, "s")
    }));
    earliestTime += secondsToAdd;
  }
  return rows;
}

module.exports = {
  arrayOf,
  createSite,
  createSpotlightItem,
  createRows,
  createWeightedArray,
  randomWeighter,
  range,
  moment
};

/**
 * String to be prepended to BASE_TIP_TOP_FAVICON_URL;
 * useful for testing.
 *
 * @param  {String}  string to prepend
 */
Object.defineProperty(module.exports, "base_tip_top_favicon_prefix", {
  get() {
    return base_tip_top_favicon_prefix;
  },
  set(newValue) {
    base_tip_top_favicon_prefix = newValue;
  }
});
