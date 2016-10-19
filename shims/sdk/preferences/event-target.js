const EventEmitter = require("shims/_utils/EventEmitter");

function PrefsTarget() {
  return new EventEmitter();
}

module.exports.PrefsTarget = PrefsTarget;
