"use strict";

const kValidCommands = new Set(["start"]);

function start(data) { // eslint-disable-line no-unused-vars
  throw new Error("function not implemented");
}

function emit(payload) { // eslint-disable-line no-unused-vars
  self.postMessage({name: "result", payload});
}

self.onmessage = ({data}) => {
  if (!data.command || !kValidCommands.has(data.command)) {
    throw new Error("invalid command");
  }
  self[data.command](data.payload);
};
