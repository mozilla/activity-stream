const VALID_KEYS = new Set([
  "type",
  "data",
  "query",
  "meta"
]);
const VALID_KEYS_STRING = Array.from(VALID_KEYS).join(", ");

// This is an extremely bare-bones action types
// that can be used if you just want a plain action,
// but you want the validations applied to it
function BaseAction(action) {
  return action;
}

// This is based on redux compose
function compose([...funcs], context) {
  context = context || this;
  return function() {
    if (funcs.length === 0) {
      return arguments[0];
    }

    const last = funcs[funcs.length - 1];
    const rest = funcs.slice(0, -1);

    return rest.reduceRight((composed, f) => f.bind(context)(composed), last.apply(null, arguments));
  };
}

class ActionManager {
  constructor(types) {
    if (!types || typeof types.length === "undefined") {
      throw new Error("You must instantiate ActionManager with an array of action types.");
    }
    this._types = new Set(types);
    this.validators = [this.validateType, this.validateStandardForm];
    this.actions = {};
    this.defineActions({BaseAction});
  }

  type(type) {
    this.validateType({type});
    return type;
  }

  defineActions(definitions) {
    Object.keys(definitions).forEach(name => {
      const definition = definitions[name];
      const composed = function() {
        return compose([
          ...this.validators,
          definition
        ], this).apply(null, arguments);
      }.bind(this);
      composed.definition = definition;
      this.actions[name] = composed;
    });
  }

  validateStandardForm(action) {
    if (!action) {
      throw new Error("Looks like your action definition does not return an object.");
    }
    if (!action.type) {
      throw new Error("You must define a type for an action.");
    }
    Object.keys(action).forEach(key => {
      if (!VALID_KEYS.has(key)) {
        throw new Error(`${key} is not a standard action key. Should be one of ${VALID_KEYS_STRING}`);
      }
    });
    return action;
    // TODO schema validation
  }

  validateType(action = {}) {
    if (!this._types.has(action.type)) {
      throw new Error(`${action.type} is not defined in your ActionManager`);
    }
    return action;
  }
}

module.exports = ActionManager;
