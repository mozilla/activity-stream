const TopSitesFeed = require("./TopSitesFeed");
const PocketStoriesFeed = require("./PocketStoriesFeed");
const PocketTopicsFeed = require("./PocketTopicsFeed");
const PlacesStatsFeed = require("./PlacesStatsFeed");
const SearchFeed = require("./SearchFeed");
const MetadataFeed = require("./MetadataFeed");
const LocalizationFeed = require("./LocalizationFeed");
const SystemTickFeed = require("./SystemTickFeed");
const BookmarksFeed = require("./BookmarksFeed");
const VisitAgainFeed = require("./VisitAgainFeed");

module.exports = [
  TopSitesFeed,
  SearchFeed,
  PocketStoriesFeed,
  PocketTopicsFeed,
  PlacesStatsFeed,
  MetadataFeed,
  LocalizationFeed,
  SystemTickFeed,
  BookmarksFeed,
  VisitAgainFeed
];
