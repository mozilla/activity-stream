/* globals Task */
const {Cu} = require("chrome");
const PocketFeed = require("./PocketFeed");
const {POCKET_TOPICS_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const {pocket_topic_endpoint, pocket_consumer_key} = require("../../pocket.json");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 3 * 60 * 60 * 1000; // 3 hours

module.exports = class PocketTopicsFeed extends PocketFeed {
  constructor(options) {
    super(options, UPDATE_TIME);
  }

  _fetchTopics() {
    if (!pocket_topic_endpoint || !pocket_consumer_key) {
      let err = "Pocket topic endpoint not configured: Make sure to add endpoint URL and " +
        "API key to pocket.json (see pocket-example.json)";
      console.log(err); // eslint-disable-line no-console
      throw new Error(err);
    }

    let pocketUrl = `${pocket_topic_endpoint}?consumer_key=${pocket_consumer_key}`;
    return this.fetch(pocketUrl).then(r => JSON.parse(r).topics.slice(0, POCKET_TOPICS_LENGTH));
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "POCKET_TOPICS_RESPONSE" action
   */
  getData() {
    return Task.spawn(function*() {
      let topics = yield this._fetchTopics();
      return am.actions.Response("POCKET_TOPICS_RESPONSE", topics);
    }.bind(this));
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;
