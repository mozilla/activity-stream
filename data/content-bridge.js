/* globals unsafeWindow, cloneInto */

"use strict";

window.addEventListener("content-to-addon", event => {
  self.port.emit("content-to-addon", JSON.parse(event.detail));
}, false);

self.port.on("addon-to-content", data => {
  const clonedData = cloneInto(data, document.defaultView);
  window.dispatchEvent(
    new CustomEvent("addon-to-content", {detail: clonedData})
  );
});

window.addEventListener("pagehide", () => {
  self.port.emit("content-to-addon", {type: "pagehide"});
}, false);

document.onreadystatechange = function() {
  self.port.emit("content-to-addon", {type: "NOTIFY_PERFORMANCE", data: `DOC_READY_STATE=${document.readyState}`});
};

unsafeWindow.navigator.activity_streams_addon = true;
