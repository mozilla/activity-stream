const DEFAULT_OPTIONS = {
  timeout: 20000,
  target: typeof window !== "undefined" ? window : {}
};

class Channel {
  constructor(options = {}) {
    if (!options.incoming) {
      throw new Error("You must specify an incoming event name with the 'incoming' option.");
    }
    if (!options.outgoing) {
      throw new Error("You must specify an outgoing event name with the 'outgoing' option.");
    }
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.callbacks = new Set();
    this.timeouts = new Map();

    this._onReceiveEvent = this.runCallbacks.bind(this);
    this.options.target.addEventListener(this.options.incoming, this._onReceiveEvent);
  }

  on(cb) {
    this.callbacks.add(cb);
  }

  off(cb) {
    if (cb) {
      this.callbacks.delete(cb);
    } else {
      this.callbacks.clear();
    }
  }

  runCallbacks(event) {
    const action = event.detail;
    this.callbacks.forEach(cb => cb(action));
  }

  broadcast(action) {
    const event = new CustomEvent(this.options.outgoing, {detail: JSON.stringify(action)});
    this.options.target.dispatchEvent(event);
  }

  connectStore(store) {
    this.on(action => store.dispatch(action));
  }

  get middleware() {
    return store => next => function(action) {
      const meta = action.meta || {};
      const timeouts = this.timeouts;

      // Send action to the next step in the middleware
      next(action);

      // Check if we were expecting this action from a RequestExpect.
      // If so, clear the timeout and remote it from the list
      if (timeouts.has(action.type)) {
        clearTimeout(timeouts.get(action.type));
        timeouts.delete(action.type);
      }

      // If this is a RequestExpect, add a timeout
      // So that we dispatch an error if the expected response
      // is never received.
      if (meta.expect) {
        const time = meta.timeout || this.options.timeout;
        const timeout = setTimeout(() => {
          const error = new Error(`Expecting ${meta.expect} but it timed out after ${time}ms`);
          error.name = "E_TIMEOUT";
          store.dispatch({type: meta.expect, error: true, data: error});
        }, time);
        timeouts.set(meta.expect, timeout);
      }

      // If the action has the right "broadcast" property on the meta property,
      // send it to the other side of the channel.
      if (meta.broadcast === this.options.outgoing) {
        this.broadcast(action);
      }
    }.bind(this);
  }
}

Channel.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

module.exports = {Channel};
