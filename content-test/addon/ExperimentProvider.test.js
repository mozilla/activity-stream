const createExperimentProvider = require("inject!addon/ExperimentProvider");
const {OVERRIDE_PREF} = require("addon/ExperimentProvider");
const {SimplePrefs} = require("shims/sdk/simple-prefs");

const DEFAULT_OPTIONS = {
  clientID: "foo",
  experiments: {
    foo: {
      name: "Foo Test",
      description: "A test about foo",
      control: {
        value: false,
        description: "Foo is 42 by default"
      },
      variant: {
        id: "foo_01",
        value: true,
        threshold: 0.5,
        description: "Twice the foo"
      }
    }
  }
};

describe("ExperimentProvider", () => {
  let experimentProvider;
  let simplePrefs;

  function setup(options = {}, customPrefs) {
    const {clientID, experiments, n} = Object.assign({}, DEFAULT_OPTIONS, options);
    simplePrefs = new SimplePrefs(customPrefs);
    const {ExperimentProvider} = createExperimentProvider({"sdk/simple-prefs": simplePrefs});
    experimentProvider = new ExperimentProvider(clientID, experiments, n && (() => n));
    experimentProvider.init();
  }

  afterEach(() => {
    experimentProvider.destroy();
    experimentProvider = null;
    simplePrefs = null;
  });

  it("should have the right properties", () => {
    setup();
    assert.ok(experimentProvider._clientID, "should have a .clientID property");
    assert.ok(experimentProvider._rng, "should have a ._rng property");
    assert.ok(experimentProvider._data, "should have a ._data property");
  });
  it("should always generate the same number given a seed", () => {
    setup({clientID: "foo"});
    assert.equal(Math.round(experimentProvider._rng() * 100) / 100, 0.73, "should generate 0.73 with clientID foo");
  });
  it("should set .experimentId", () => {
    setup({n: 0.8});
    assert.equal(experimentProvider.experimentId, null, "should be null for control group");
  });
  it("should set .experimentId", () => {
    setup({n: 0.1});
    assert.equal(experimentProvider.experimentId, "foo_01", "should be foo_01 if in experiment");
  });
  it("should set .data ", () => {
    setup({clientID: "baz"});
    assert.equal(experimentProvider.data, experimentProvider._data, ".data should return return this._data");
    assert.deepEqual(experimentProvider.data, {foo: DEFAULT_OPTIONS.experiments.foo.control.value}, "clientID 'baz' should result in control being picked");
  });
  it("should set .data", () => {
    setup({clientID: "012j"});
    assert.deepEqual(experimentProvider.data, {foo: DEFAULT_OPTIONS.experiments.foo.variant.value}, "clientID '012j' should result in variant being picked");
  });
  it("should throw if experiment cohorts add to > 1", () => {
    assert.throws(() => {
      setup({
        experiments: {
          foo: {
            name: "foo",
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {id: "foo_01", value: true, threshold: 0.5, description: "foo"}
          },
          bar: {
            name: "bar",
            description: "bar",
            control: {value: false, description: "bar"},
            variant: {id: "bar_01", value: true, threshold: 0.6, description: "bar"}
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
          control: {value: false},
          variant: {id: "kitty_01", threshold: 0.2, value: true}
        },
        dachshund: {
          name: "dachshund",
          control: {value: false},
          variant: {id: "dachshund_01", threshold: 0.2, value: true}
        }
      },
      n: randomNumber
    });
    assert.equal(experimentProvider.data.dachshund, true, "dachshund should be selected");
    assert.equal(experimentProvider.data.kitty, false, "kitty should not be selected");
    assert.equal(experimentProvider.experimentId, "dachshund_01", "the experimentId should be dachshund_01");
  });
  it("should skip experiments with active:false", () => {
    setup({
      clientID: "foo",
      experiments: {
        foo: {
          active: false,
          name: "foo",
          control: {value: "bloo"},
          variant: {
            id: "asdasd",
            threshold: 0.3,
            value: "blah"
          }
        }
      }
    });
    assert.deepEqual(experimentProvider.data, {}, "should have empty .data");
  });

  describe("overrides", () => {
    it("should override experiments and not set an experimentId", () => {
      const prefs = {};
      prefs[OVERRIDE_PREF] = "foo";
      setup(undefined, prefs);
      assert.equal(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.variant.value);
      assert.equal(experimentProvider.experimentId, null);
    });
    it("should turn on an experiment even if it is active: false", () => {
      const prefs = {};
      prefs[OVERRIDE_PREF] = "foo";
      setup(undefined, prefs);
      assert.equal(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.variant.value);
    });
    it("should override multiple experiments", () => {
      const prefs = {};
      prefs[OVERRIDE_PREF] = "foo, bar";
      setup({
        experiments: {
          foo: {
            name: "foo",
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {id: "foo_01", value: true, threshold: 0.2, description: "foo"}
          },
          bar: {
            name: "bar",
            description: "bar",
            control: {value: false, description: "bar"},
            variant: {id: "bar_01", value: true, threshold: 0.2, description: "bar"}
          }
        }
      }, prefs);
      assert.isTrue(experimentProvider.data.foo);
      assert.isTrue(experimentProvider.data.bar);
      assert.equal(experimentProvider.experimentId, null);
    });
    it("should add a pref listener on experimentOverrides", () => {
      setup();
      assert.calledWith(simplePrefs.on, OVERRIDE_PREF);
    });
    it("should remove the pref listener on experimentOverrides and reset data, experimentId", () => {
      setup();
      experimentProvider.destroy();
      assert.calledWith(simplePrefs.off, OVERRIDE_PREF);
      assert.isNull(experimentProvider.experimentId);
      assert.deepEqual(experimentProvider.data, {});
    });
    it("should reset experiments on a pref change", () => {
      setup({
        experiments: {
          foo: {
            name: "foo",
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {id: "foo_01", value: true, threshold: 0.2, description: "foo"}
          }
        }
      });
      assert.isFalse(experimentProvider.data.foo);
      simplePrefs.prefs[OVERRIDE_PREF] = "foo";
      experimentProvider._onPrefChange();
      assert.isTrue(experimentProvider.data.foo);
    });
  });
});
