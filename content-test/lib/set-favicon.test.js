const setFavicon = require("lib/set-favicon");

describe("setFavicon", () => {
  it("should set the favicon of the current page", () => {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "img/list-icon.svg";
    document.head.appendChild(link);
    assert.include(document.head.querySelector("link[rel='icon']").href, "img/list-icon.svg");
    setFavicon("newtab-icon.svg");
    assert.include(document.head.querySelector("link[rel='icon']").href, "img/newtab-icon.svg");
  });
});
