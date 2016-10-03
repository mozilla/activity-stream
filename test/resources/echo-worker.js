/* globals importScripts, start:true, emit */
/* exported start */

"use strict";

importScripts("../../data/workers/base.js");

start = data => {
  emit(data);
};
