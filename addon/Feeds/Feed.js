module.exports = class Feed {
  constructor(options = {}) {
    this.options = options;
    this.state = {
      lastUpdated: null,
      inProgress: false
    };
    this.store = null; // added in .connectStore
  }
  connectStore(store) {
    this.store = store;
  }
  log(text) {
    console.log(text);
  }
  refresh(reason) {
    return new Promise((resolve, reject) => {
      if (!this.getData || typeof this.getData !== "function") {
        reject(new Error("You need to declare a .getData function on your feed in order to use .refresh"));
        return;
      }
      if (!this.store) {
        reject(new Error("No store was connected"));
        return;
      }
      if (this.state.inProgress) {
        resolve();
        return;
      }

      this.state.inProgress = true;
      this.log(`Refreshing data for ${this.constructor.name}` + (reason ? ` because ${reason}` : "")); // eslint-disable-line prefer-template

      this.getData()
        .then(action => {
          this.store.dispatch(action);
          this.state.inProgress = false;
          this.state.lastUpdated = new Date().getTime();
          resolve();
        })
        .catch(err => {
          this.state.inProgress = false;
          reject(err);
        });
    });
  }
};
