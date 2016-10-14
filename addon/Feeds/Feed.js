module.exports = class Feed {
  constructor(options = {}) {
    this.lastUpdated = null;
    this.inProgress = false;
    this.getMetadata = options.getMetadata;
    this.store = null; // added in Feeds.connectStore
  }
  connectStore(store) {
    this.store = store;
  }
  log(text) {
    console.log(text);
  }
  refresh(reason) {
    return new Promise((resolve, reject) => {
      if (!this.getData) {
        reject(new Error("Looks like no getData method was defined"));
        return;
      }
      if (!this.store) {
        reject(new Error("No store was connected"));
        return;
      }
      if (this.inProgress) {
        resolve();
        return;
      }

      this.inProgress = true;
      this.log(`Refreshing data for ${this.constructor.name}` + (reason ? ` because ${reason}` : "")); // eslint-disable-line prefer-template

      this.getData()
        .then(action => {
          this.store.dispatch(action);
          this.inProgress = false;
          this.lastUpdated = new Date().getTime();
          resolve();
        })
        .catch(err => {
          this.inProgress = false;
          reject(err);
        });
    });
  }
};
