module.exports = class FeedController {
  constructor(options) {
    // Add feeds here
    this.feeds = options.feeds.map(F => new F(options));

    this.reduxMiddleware = store => next => action => {
      next(action);
      this.feeds.forEach(feed => {
        try {
          feed.onAction(store.getState(), action);
        } catch (e) {
          console.log(`Error caught in reducer for ${feed.constructor.name}`, e);
        }
      });
    };
  }
  connectStore(store) {
    this.feeds.forEach(f => f.connectStore(store));
  }
};
