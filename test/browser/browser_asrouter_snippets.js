"use strict";

const {ASRouter} =
  ChromeUtils.import("resource://activity-stream/lib/ASRouter.jsm");

test_newtab({
  async before({pushPrefs}) {
    let data = ASRouter.state.messages.find(m => m.id === "SIMPLE_BELOW_SEARCH_TEST_1");
    ASRouter.messageChannel.sendAsyncMessage("ASRouter:parent-to-child", {type: "SET_MESSAGE", data});
  },
  test: function test_simple_below_search_snippet() {
    // Verify the simple_below_search_snippet renders in container below searchbox
    // and nothing is rendered in the footer.
    let container = content.document.querySelector(".below-search-snippet");
    ok(container, "Got the snippet container");
    let snippet = container.querySelector(".SimpleBelowSearchSnippet");
    ok(snippet, "Got the snippet inside the below search container");
    is(0, content.document.querySelector("#footer-asrouter-container").childNodes.length,
      "No snippets in the footer container");
  },
});

test_newtab({
  async before({pushPrefs}) {
    let data = ASRouter.state.messages.find(m => m.id === "SIMPLE_TEST_1");
    ASRouter.messageChannel.sendAsyncMessage("ASRouter:parent-to-child", {type: "SET_MESSAGE", data});
  },
  test: function test_simple_snippet() {
    // Verify the simple_snippet renders in the footer and the container below
    // searchbox is not rendered.
    let container = content.document.querySelector("#footer-asrouter-container");
    ok(container, "Got the snippet container");
    let snippet = container.querySelector(".SimpleSnippet");
    ok(snippet, "Got the snippet inside the footer container");
    ok(!content.document.querySelector(".below-search-snippet"), "No snippets below search");
  },
});
