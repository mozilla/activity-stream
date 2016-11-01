const {Cu} = require("chrome");

module.exports = class FeedController {
  constructor(options) {
    const feeds = options.feeds;
    const otherOptions = Object.assign({}, options);
    delete otherOptions.feeds;
    this.feeds = feeds.map(F => new F(otherOptions));

    this.reduxMiddleware = store => next => action => {
      next(action);
      this.feeds.forEach(feed => {
        try {
          feed.onAction(store.getState(), action);
        } catch (e) {
          Cu.reportError(`Error caught in .onAction for ${feed.constructor.name}: ${e}`);
        }
      });
    };
  }
  connectStore(store) {
    this.feeds.forEach(f => f.connectStore(store));
  }
};
