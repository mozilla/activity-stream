/* globals importScripts, start:true, emit */
/* exported start */

"use strict";

importScripts("../../data/workers/base.js");
let count = 0;

start = data => {
  count += 1;
  if ((count % 2) !== 0) {
    throw new Error("i like being fussy");
  } else {
    emit(data);
  }
};
