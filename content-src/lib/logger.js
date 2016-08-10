module.exports = {
  log() {
    if (__CONFIG__.LOGGING) {
      console.log(...arguments); // eslint-disable-line no-console
    }
  }
};
