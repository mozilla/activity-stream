const TEST_LOCALES = ["en-US", "en", "fr"];

module.exports = {
  findClosestLocale(available, suggested) {
    return available.filter(item => suggested.indexOf(item) > -1)[0] || available[0];
  },
  getPreferedLocales() {
    return TEST_LOCALES;
  },
  TEST_LOCALES
};
