/* globals describe, it, beforeEach */

const ActionManager = require("common/ActionManager");
const {assert} = require("chai");

describe("ActionManager", () => {

  describe("instance", () => {
    it("should throw if types is not an array", () => {
      assert.throws(() => new ActionManager(), "You must instantiate ActionManager with an array of action types.");
    });
    it("should create this._types", () => {
      const am = new ActionManager(["FOO", "BAR"]);
      assert.deepEqual(am._types, new Set(["FOO", "BAR"]));
    });
    it("should create this._types", () => {
      const am = new ActionManager(["FOO", "BAR"]);
      assert.deepEqual(am._types, new Set(["FOO", "BAR"]));
    });
    it("should create default validators, actions", () => {
      const am = new ActionManager(["FOO", "BAR"]);
      assert.isArray(am.validators);
      assert.isObject(am.actions);
      assert.property(am.actions, "BaseAction");
    });
  });

  describe("#defineActions", () => {
    it("should add actions to this.actions", () => {
      const am = new ActionManager(["FOO", "BAR"]);
      am.defineActions({Foo: () => {}});
      assert.property(am.actions, "Foo");
      assert.isFunction(am.actions.Foo);
    });
    it("should return the result of the action definition", () => {
      const am = new ActionManager(["FOO", "BAR"]);
      function Foo(data) {
        return {type: "FOO", data};
      }
      am.defineActions({Foo});
      const result = am.actions.Foo("data");
      assert.deepEqual(result, {type: "FOO", data: "data"});
    });
    it("should run validations for defined actions", () => {
      const am = new ActionManager(["FOO"]);
      am.defineActions({Foo: () => {}, Bar: () => ({type: "BAR"})});
      assert.throws(() => {
        am.actions.Foo();
      }, "Looks like your action definition does not return an object.");
      assert.throws(() => {
        am.actions.Bar();
      }, "BAR is not defined in your ActionManager");
    });
    it("should allow validations to be changed after definitions", () => {
      const am = new ActionManager(["FOO"]);
      am.defineActions({Foo: () => {}, Bar: () => ({type: "BAR"})});
      am.validators = [];
      assert.doesNotThrow(() => am.actions.Foo());
    });
  });

  describe("#validateStandardForm", () => {
    let am;
    beforeEach(() => {
      am = new ActionManager(["FOO", "BAR"]);
    });
    it("should throw if an action definition does not return an object", () => {
      am.defineActions({Foo: () => null});
      assert.throws(() => {
        am.actions.Foo();
      }, "Looks like your action definition does not return an object.");
    });
    it("should throw if an action doesn't have a type", () => {
      am.defineActions({Foo: () => ({data: "data"})});
      assert.throws(() => {
        am.actions.Foo();
      }, "You must define a type for an action.");
    });
    it("should throw if an action has a non standard key", () => {
      am.defineActions({Foo: () => ({type: "FOO", foo: "data"})});
      assert.throws(() => {
        am.actions.Foo();
      }, "foo is not a standard action key. Should be one of type, data, query, meta");
    });
  });

  describe("#validateType", () => {
    let am;
    beforeEach(() => {
      am = new ActionManager(["FOO"]);
    });
    it("should throw if an action has type that wasn't defined in the action manager", () => {
      am.defineActions({Foo: () => ({type: "BAZ"})});
      assert.throws(() => {
        am.actions.Foo();
      }, "BAZ is not defined in your ActionManager");
    });
  });

  describe("#type", () => {
    let am;
    beforeEach(() => {
      am = new ActionManager(["FOO"]);
    });
    it("should return the type if it is defined", () => {
      assert.equal(am.type("FOO"), "FOO");
    });
    it("should throw if the type is undefined", () => {
      assert.throws(() => {
        am.type("BAZ");
      }, "BAZ is not defined in your ActionManager");
    });
  });

});
