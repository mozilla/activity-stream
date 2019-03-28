let cache = {
  query(url, size, set) {
    // console.log(`query: ${url} – ${size}`);

    // Create an empty set if none exists
    // Need multiple cache sets because the browser decides what set to use based on pixel density
    if (this.queuedImages[set] === undefined) {
      this.queuedImages[set] = {};
    }

    let sizeToRequest; // The px width to request from Thumbor via query value

    if (!this.queuedImages[set][url] || this.queuedImages[set][url] < size) {
      this.queuedImages[set][url] = size;
      sizeToRequest = size;
    } else {
      // Use the larger size already queued for download (and allow browser to scale down)
      sizeToRequest = this.queuedImages[set][url];
    }

    console.log(sizeToRequest);
    return sizeToRequest;
  },
  queuedImages: {}
};

window.imgcache = cache; // TODO: FOR DEBUG ONLY!

export { cache };
