class EventEmitter {
  constructor() {
    this.on = sinon.spy();
    this.off = sinon.spy();
    this.emit = sinon.spy();
    this.removeListener = (...args) => this.off(...args);
  }
}

module.exports = EventEmitter;
