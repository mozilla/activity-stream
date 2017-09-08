module.exports = {
  // constant to know if the page is about:newtab or about:home
  IS_NEWTAB: global.document && global.document.documentURI === "about:newtab"
};
