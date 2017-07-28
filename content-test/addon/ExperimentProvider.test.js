const createExperimentProvider = require("inject!addon/ExperimentProvider");
const {PrefService} = require("shims/sdk/preferences/service");
const PrefsTarget = require("shims/sdk/preferences/event-target");
const {preferencesBranch} = require("sdk/self");

const DEFAULT_OPTIONS = {
  clientID: "foo",
  experiments: {
    foo: {
      slug: "foo",
      name: "Foo Test",
      active: true,
      description: "A test about foo",
      control: {
        value: false,
        description: "Foo is 42 by default"
      },
      variant: {
        id: "foo",
        value: true,
        threshold: 0.5,
        description: "Twice the foo"
      }
    }
  }
};

describe("ExperimentProvider", () => {
  let experimentProvider;
  let prefService = new PrefService();

  function setup(options = {}) {
    const {experiments, n} = Object.assign({}, DEFAULT_OPTIONS, options);
    const {ExperimentProvider} = createExperimentProvider({
      "sdk/preferences/service": prefService,
      "sdk/preferences/event-target": PrefsTarget
    });
    experimentProvider = new ExperimentProvider(experiments, n && (() => n));
    experimentProvider.init();
  }

  beforeEach(() => {
    prefService.set(`extensions.${preferencesBranch}.activateExperiments`, true);
    global.EventEmitter = {
      decorate(ctx) {
        ctx.emit = sinon.spy();
        ctx.on = sinon.spy();
      }
    };
  });

  afterEach(() => {
    delete global.EventEmitter;
    experimentProvider.destroy();
    experimentProvider.clearPrefs();
    experimentProvider = null;
  });

  it("should have the right properties", () => {
    setup();
    assert.ok(experimentProvider._rng, "should have a ._rng property");
    assert.ok(experimentProvider._data, "should have a ._data property");
  });
  it("should set .experimentId", () => {
    setup({n: 0.8});
    assert.isNull(experimentProvider.experimentId, "should be null for control group");
  });
  it("should set .experimentId", () => {
    setup({n: 0.1});
    assert.equal(experimentProvider.experimentId, "foo", "should be foo if in experiment");
  });
  it("should set .data ", () => {
    setup({clientID: "baz", n: 0.6});
    assert.equal(experimentProvider.data, experimentProvider._data, ".data should return this._data");
    assert.deepEqual(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.control.value, "should result in control being picked");
  });
  it("should set .data", () => {
    setup({clientID: "012j", n: 0.3});
    assert.deepEqual(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.variant.value, "should result in variant being picked");
  });
  it("should throw if experiment cohorts add to > 1", () => {
    assert.throws(() => {
      setup({
        experiments: {
          foo: {
            name: "foo",
            active: true,
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {value: true, threshold: 0.5, description: "foo"}
          },
          bar_01: {
            name: "bar",
            active: true,
            description: "bar",
            control: {value: false, description: "bar"},
            variant: {value: true, threshold: 0.6, description: "bar"}
          }
        }
      });
    });
  });
  it("should only select one experiment", () => {
    const randomNumber = 0.2;
    setup({
      clientID: "foo",
      experiments: {
        kitty: {
          name: "kitty",
          active: true,
          control: {value: false},
          variant: {threshold: 0.2, value: true}
        },
        dachshund: {
          name: "dachshund",
          active: true,
          control: {value: false},
          variant: {threshold: 0.2, value: true}
        }
      },
      n: randomNumber
    });
    assert.isTrue(experimentProvider.data.dachshund, "dachshund should be selected");
    assert.isFalse(experimentProvider.data.kitty, "kitty should not be selected");
    assert.equal(experimentProvider.experimentId, "dachshund", "the experimentId should be dachshund");
  });
  it("should skip experiments with active:false", () => {
    setup({
      clientID: "foo",
      experiments: {
        asdasd: {
          active: false,
          name: "foo",
          control: {value: "bloo"},
          variant: {
            threshold: 0.3,
            value: "blah"
          }
        }
      },
      n: 0.1
    });
    assert.equal(experimentProvider.data.foo, undefined, "foo is not selected");
  });
  it("should stringify data", () => {
    setup({n: 0.2});
    assert.equal(JSON.stringify(experimentProvider.data), JSON.stringify({foo: true}));
  });

  describe("listeners", () => {
    it("should emit an event on experiment enrollment", () => {
      setup();
      const experimentId = "foo";
      const variant = {description: "Twice the foo", id: "foo", threshold: 0.5, value: true};
      experimentProvider.enroll(experimentId, variant);
      assert.calledWith(experimentProvider.emit, "experimentEnrolled", {id: experimentId, variant});
    });
  });
});
