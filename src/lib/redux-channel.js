const DEFAULT_TIMEOUT = 5000;

class Channel {
  constructor(options = {}) {
    Object.keys(options).forEach(key => {
      this[key] = options[key];
    });
    this.callbacks = new Set();
    this.timeouts = new Map();
    window.addEventListener(this.incoming, this.runCallbacks.bind(this));
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
    const event = new CustomEvent(this.outgoing, {detail: action});
    window.dispatchEvent(event);
  }

  get connectStore() {
    return reduxConnectStore => {
      return function (reducer, initialState, enhancer) {
        const store = reduxConnectStore(reducer, initialState, enhancer);
        this.on(action => store.dispatch(action));
        return store;
      }.bind(this);
    };
  }

  get middleware() {
    return store => next => function (action) {
      const meta = action.meta || {};
      const timeouts = this.timeouts;

      next(action.toJSON ? action.toJSON() : action);

      if (timeouts.has(action.type)) {
        clearTimeout(timeouts.get(action.type));
        timeouts.delete(action.type);
      }

      if (meta.expect) {
        const time = meta.timeout || DEFAULT_TIMEOUT;
        const timeout = setTimeout(() => {
          const error = new Error(`Expecting ${meta.expect} but it timed out after ${time}ms`);
          error.name = "E_TIMEOUT";
          store.dispatch({type: meta.expect, error: true, data: error});
        }, time);
        timeouts.set(meta.expect, timeout);
        this.broadcast(action);
      }
    }.bind(this);
  }
}

class ChannelAction {

  // TODO
  // marshalArgs(args, defn) {
  //
  // }

  toJSON() {
    const plainObject = {};
    Object.keys(this).forEach(key => {
      plainObject[key] = this[key];
    });
    return plainObject;
  }
}

class RequestExpect extends ChannelAction {
  constructor(type, query, expectType, timeout = RequestExpect.DEFAULT_TIMEOUT) {
    super();
    this.type = type;
    this.query = this.query;
    this.meta = {expect: expectType, timeout};
  }
}
RequestExpect.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

class Request extends ChannelAction {
  constructor(type, query) {
    super();
    this.type = type;
    if (typeof query !== 'undefined') this.query = query;
  }
}

class ResponseSuccess extends ChannelAction {
  constructor(type, data) {
    super();
    this.type = type;
    if (typeof data !== "undefined") this.data = data;
  }
}

class ResponseError extends ChannelAction {
  constructor(type, error) {
    super();
    this.type = type;
    this.data = error;
    this.error = true;
  }
}

module.exports = {
  Channel,
  ActionTypes: {Request, RequestExpect, ResponseSuccess, ResponseError}
};
