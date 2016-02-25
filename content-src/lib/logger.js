module.exports = {
  log() {
    if (__CONFIG__.LOGGING) {
      console.log.apply(console, arguments); // eslint-disable-line no-console
    }
  }
};
