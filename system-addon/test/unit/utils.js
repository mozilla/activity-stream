/**
 * GlobalOverrider - Utility that allows you to override properties on the global object.
 *                   See unit-entry.js for example usage.
 */
class GlobalOverrider {
  constructor() {
    this.originalGlobals = new Map();
    this.sandbox = sinon.sandbox.create();
  }

  /**
   * _override - Internal method to override properties on the global object.
   *             The first time a given key is overridden, we cache the original
   *             value in this.originalGlobals so that later it can be restored.
   *
   * @param  {string} key The identifier of the property
   * @param  {any} value The value to which the property should be reassigned
   */
  _override(key, value) {
    if (key === "Components") {
      // Components can be reassigned, but it will subsequently throw a deprecation
      // error in Firefox which will stop execution. Adding the assignment statement
      // to a try/catch block will prevent this from happening.
      try {global[key] = value} catch (e) {}
      return;
    }
    if (!this.originalGlobals.has(key)) {
      this.originalGlobals.set(key, global[key]);
    }
    global[key] = value;
  }

  /**
   * set - Override a given property, or all properties on an object
   *
   * @param  {string|object} key If a string, the identifier of the property
   *                             If an object, a number of properties and values to which they should be reassigned.
   * @param  {any} value The value to which the property should be reassigned
   * @return {type}       description
   */
  set(key, value) {
    if (!value && typeof key === "object") {
      const overrides = key;
      Object.keys(overrides).forEach(key => this._override(key, overrides[key]));
    } else {
      this._override(key, value);
    }
  }

  /**
   * reset - Reset the global sandbox, so all state on spies, stubs etc. is cleared.
   *         You probably want to call this after each test.
   */
  reset() {
    this.sandbox.reset();
  }

  /**
   * restore - Restore the global sandbox and reset all overriden properties to
   *           their original values. You should call this after all tests have completed.
   */
  restore() {
    this.sandbox.restore();
    this.originalGlobals.forEach((value, key) => {
      global[key] = value;
    });
  }
}

/**
 * addNumberReducer - a simple dummy reducer for testing that adds a number
 */
function addNumberReducer(prevState = 0, action) {
  return action.type === "ADD" ? prevState + action.data : prevState
}

module.exports = {
  GlobalOverrider,
  addNumberReducer
};
