"use strict";

let LIFOQueue = function() {
  this._queue = [];
};

LIFOQueue.prototype = {
  enqueue(data) {
    if (data === null) {
      return;
    }
    this._queue.push(data);
  },

  dequeue() {
    return this._queue.length ? this._queue.pop() : null;
  },

  peek() {
    return this._queue.length ? this._queue[this._queue.length - 1] : null;
  },

  get size() {
    return this._queue.length;
  }
};

exports.LIFOQueue = LIFOQueue;
