module.exports = {
  log(...args) {
    if (__CONFIG__.LOGGING) {
      console.log(...args); // eslint-disable-line no-console
    }
  }
};
