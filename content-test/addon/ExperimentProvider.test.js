const simplePrefs = require("sdk/simple-prefs");
const createExperimentProvider = require("inject!addon/ExperimentProvider");
const {PrefService} = require("shims/sdk/preferences/service");
const PrefsTarget = require("shims/sdk/preferences/event-target");
const {preferencesBranch} = require("sdk/self");
const PREF_PREFIX = `extensions.${preferencesBranch}.experiments.`;

const DEFAULT_OPTIONS = {
  clientID: "foo",
  experiments: {
    foo: {
      name: "Foo Test",
      active: true,
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
    assert.equal(experimentProvider.experimentId, "foo_01", "should be foo_01 if in experiment");
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
            variant: {id: "foo_01", value: true, threshold: 0.5, description: "foo"}
          },
          bar: {
            name: "bar",
            active: true,
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
          active: true,
          control: {value: false},
          variant: {id: "kitty_01", threshold: 0.2, value: true}
        },
        dachshund: {
          name: "dachshund",
          active: true,
          control: {value: false},
          variant: {id: "dachshund_01", threshold: 0.2, value: true}
        }
      },
      n: randomNumber
    });
    assert.isTrue(experimentProvider.data.dachshund, "dachshund should be selected");
    assert.isFalse(experimentProvider.data.kitty, "kitty should not be selected");
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
      },
      n: 0.1
    });
    assert.equal(experimentProvider.data.foo, undefined, "foo is not selected");
  });
  it("should stringify data", () => {
    setup({n: 0.2});
    assert.equal(JSON.stringify(experimentProvider.data), JSON.stringify({foo: true}));
  });

  describe("overrides", () => {
    it("should create new prefs for new experiments after override", () => {
      let data = {
        clientID: "foo",
        experiments: {
          kitty: {
            name: "kitty",
            active: true,
            control: {value: false},
            variant: {id: "kitty_01", threshold: 0.2, value: true}
          }
        },
        n: 0.8
      };
      setup(data);

      prefService.set(`${PREF_PREFIX}foo`, true);
      experimentProvider._onPrefChange();

      experimentProvider.destroy();
      data.experiments.dachshund = {
        name: "dachshund",
        active: true,
        control: {value: false},
        variant: {id: "dachshund_01", threshold: 0.2, value: true}
      };
      data.n = 0.1;

      setup(data);

      assert.isFalse(experimentProvider.data.dachshund);
    });
    it("should override experiments and not set an experimentId", () => {
      setup({n: 0.2});
      assert.isTrue(experimentProvider.data.foo);
      assert.equal(experimentProvider.experimentId, "foo_01");

      prefService.set(`${PREF_PREFIX}foo`, false);
      experimentProvider._onPrefChange();

      assert.equal(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.control.value);
      assert.isNull(experimentProvider.experimentId);
    });
    it("should turn on an experiment even if it is active: false", () => {
      setup({n: 0.8});
      assert.isFalse(experimentProvider.data.foo);
      assert.isNull(experimentProvider.experimentId);

      prefService.set(`${PREF_PREFIX}foo`, true);
      experimentProvider._onPrefChange();

      assert.equal(experimentProvider.data.foo, DEFAULT_OPTIONS.experiments.foo.variant.value);
      assert.isNull(experimentProvider.experimentId);
    });
    it["should enable a disabled experiment"] = assert => {
      let data = {
        clientID: "foo",
        experiments: {
          kitty: {
            name: "kitty",
            active: false,
            control: {value: false},
            variant: {id: "kitty_01", threshold: 0.2, value: true}
          }
        },
        n: 0.1
      };
      setup(data);
      assert.equal(experimentProvider.data.kitty, undefined);
      assert.isNull(experimentProvider.experimentId);

      experimentProvider.destroy();
      data.experiments.kitty.active = true;

      setup(data);

      assert.isTrue(experimentProvider.data.kitty);
      assert.equal(experimentProvider.experimentId, "kitty_01");
    };
    it("should override multiple experiments", () => {
      setup({
        experiments: {
          foo: {
            name: "foo",
            active: true,
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {id: "foo_01", value: true, threshold: 0.2, description: "foo"}
          },
          bar: {
            name: "bar",
            active: true,
            description: "bar",
            control: {value: false, description: "bar"},
            variant: {id: "bar_01", value: true, threshold: 0.2, description: "bar"}
          }
        },
        n: 0.4
      });
      assert.isFalse(experimentProvider.data.foo);
      assert.isFalse(experimentProvider.data.bar);

      prefService.set(`${PREF_PREFIX}foo`, true);
      prefService.set(`${PREF_PREFIX}bar`, true);
      experimentProvider._onPrefChange();

      assert.isTrue(experimentProvider.data.foo);
      assert.isTrue(experimentProvider.data.bar);
      assert.isNull(experimentProvider.experimentId);
    });
    it("should add a pref listener on new, active experiments", () => {
      setup({n: 0.3});
      assert.calledWith(experimentProvider._target.on, `${PREF_PREFIX}foo`);
    });
    it("should remove the pref listener on experiment prefs and reset experimentId", () => {
      setup({n: 0.1});
      experimentProvider.destroy();
      assert.calledWith(experimentProvider._target.off, `${PREF_PREFIX}foo`);
      assert.isNull(experimentProvider.experimentId);
    });
    it("should reset experiments on a pref change", () => {
      setup({
        experiments: {
          foo: {
            name: "foo",
            active: true,
            description: "foo",
            control: {value: false, description: "foo"},
            variant: {id: "foo_01", value: true, threshold: 0.2, description: "foo"}
          }
        },
        n: 0.3
      });
      assert.isFalse(experimentProvider.data.foo);
      prefService.set(`${PREF_PREFIX}foo`, true);
      experimentProvider._onPrefChange();
      assert.isTrue(experimentProvider.data.foo);
    });
    it("should disable experiment with participating user", () => {
      let data = {
        clientID: "foo",
        experiments: {
          kitty: {
            name: "kitty",
            active: true,
            control: {value: false},
            variant: {id: "kitty_01", threshold: 0.2, value: true}
          }
        },
        n: 0.1
      };
      setup(data);
      assert.isTrue(experimentProvider.data.kitty);
      assert.equal(experimentProvider.experimentId, "kitty_01");

      experimentProvider.destroy();

      assert.isTrue(experimentProvider.data.kitty);
      assert.isNull(experimentProvider.experimentId);

      data.experiments.kitty.active = false;
      setup(data);

      assert.isFalse(experimentProvider.data.kitty);
      assert.isNull(experimentProvider.experimentId);

      // Reactivating an experiment that a user was in that became
      // inactive should not re-consider that user.
      data.experiments.kitty.active = true;
      experimentProvider.destroy();
      setup(data);

      assert.isFalse(experimentProvider.data.kitty);
      assert.isNull(experimentProvider.experimentId);
    });
    it("should make new experiment available", () => {
      let data = {
        clientID: "foo",
        experiments: {
          kitty: {
            name: "kitty",
            active: true,
            control: {value: false},
            variant: {id: "kitty_01", threshold: 0.2, value: true}
          }
        },
        n: 0.3
      };
      setup(data);
      assert.isFalse(experimentProvider.data.kitty);
      assert.isNull(experimentProvider.experimentId);

      experimentProvider.destroy();
      data.experiments.dachshund = {
        name: "dachshund",
        active: true,
        control: {value: false},
        variant: {id: "dachshund_01", threshold: 0.2, value: true}
      };
      data.n = 0.1;

      setup(data);

      // We weren't in the kitty experiment initally, so we will stay
      // out of it even though our new random number would normally choose kitty.
      assert.isFalse(experimentProvider.data.kitty);
      assert.isTrue(experimentProvider.data.dachshund);
      assert.equal(experimentProvider.experimentId, "dachshund_01");
    });
    it("should remain in override state after restart", () => {
      setup({n: 0.8});
      assert.isFalse(experimentProvider.data.foo);
      assert.isFalse(simplePrefs.prefs.experimentsOverridden);

      prefService.set(`${PREF_PREFIX}foo`, true);
      experimentProvider._onPrefChange();

      assert.isTrue(experimentProvider.data.foo);
      assert.isTrue(simplePrefs.prefs.experimentsOverridden);

      experimentProvider.destroy();
      setup({n: 0.8});

      assert.isTrue(experimentProvider.data.foo);
      assert.isTrue(simplePrefs.prefs.experimentsOverridden);
    });
    it("should disable all active experiments if pref says so", () => {
      const data = {
        clientID: "foo",
        experiments: {
          activeFoo: {
            name: "Active Foo Test",
            active: true,
            control: {value: "control_val"},
            variant: {id: "foo_01", value: "variant_val", threshold: 0.5}
          },
          notActiveFoo: {
            name: "Not Active Foo Test",
            active: false,
            control: {value: false},
            variant: {id: "foo_02", value: true, threshold: 0.5}
          }
        }
      };
      prefService.set(`extensions.${preferencesBranch}.activateExperiments`, false);
      setup(data);
      assert.equal(prefService.get(`${PREF_PREFIX}activeFoo`), data.experiments.activeFoo.control.value);
      assert.equal(prefService.get(`${PREF_PREFIX}notActiveFoo`, undefined));
    });
  });

  describe("listeners", () => {
    it("should emit a change event on a pref change", () => {
      setup();
      experimentProvider._onPrefChange("foo");
      assert.calledWith(experimentProvider.emit, "change", "foo");
    });
    it("should emit an event on experiment enrollment", () => {
      setup();
      const experimentId = "foo";
      const variant = {description: "Twice the foo", id: "foo_01", threshold: 0.5, value: true};
      experimentProvider.enroll(experimentId, variant);
      assert.calledWith(experimentProvider.emit, "experimentEnrolled", {id: experimentId, variant});
    });
    it("should set pocket pref on pocket experiment enrollment", () => {
      setup();
      assert.isUndefined(simplePrefs.prefs.showPocket);
      const experimentId = "pocket";
      const variant = {description: "Pocket experiment", id: "pocket_01", threshold: 0.5, value: true};
      experimentProvider.enroll(experimentId, variant);
      assert.isTrue(simplePrefs.prefs.showPocket);
    });
  });
});
