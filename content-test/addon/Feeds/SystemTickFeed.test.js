const {SYSTEM_TICK_INTERVAL} = require("common/constants");

describe("SystemTickFeed", () => {
  let SystemTickFeed;
  let instance;
  let clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers();
    SystemTickFeed = require("inject!addon/Feeds/SystemTickFeed")({"sdk/timers": {setInterval, clearInterval}});
    instance = new SystemTickFeed();
    instance.store = {getState() { return {}; }, dispatch(evt) {}};
  });
  afterEach(() => {
    clock.restore();
  });
  it("should create a SystemTickFeed", () => {
    assert.instanceOf(instance, SystemTickFeed);
  });
  it("should fire SYSTEM_TICK events at configured interval", () => {
    let expectation = sinon.mock(instance.store).expects("dispatch")
      .twice()
      .withExactArgs({type: "SYSTEM_TICK"});

    instance.onAction({}, {type: "APP_INIT"});
    clock.tick(SYSTEM_TICK_INTERVAL * 2);
    expectation.verify();
  });
});
