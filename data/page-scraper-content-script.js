function sendData() {
  const text = document.documentElement.innerHTML;
  const url = document.documentURI;
  self.port.emit("message", {type: "PAGE_HTML", data: {text, url}});
}

sendData();
if (document.readyState === "complete") {
  sendData();
} else {
  window.addEventListener("load", sendData);
}

window.addEventListener("pagehide", sendData);
