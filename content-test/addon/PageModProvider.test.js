const PageModProvider = require("inject!addon/PageModProvider")({"addon/lib/uuid": () => String(Math.random())});
const {PageMod, Worker} = require("sdk/page-mod");
const TEST_URL = "foo.html";
const {CONTENT_TO_ADDON} = require("common/event-constants");
const {WORKER_ATTACHED_EVENT} = require("common/constants");

describe("#PageModProvider", () => {
  let instance;
  beforeEach(() => {
    instance = new PageModProvider({pageURL: TEST_URL});
  });
  describe("#init", () => {
    it("should add ._logEvent if logEvent is defined", () => {
      const logEvent = () => {};
      instance.init({logEvent});
      assert.equal(instance._logEvent, logEvent);
    });
    it("should add ._pagemod", () => {
      instance.init();
      assert.instanceOf(instance._pagemod, PageMod);
    });
  });
  describe("._pagemod", () => {
    it("should have the set .include according to the pageURL", () => {
      instance = new PageModProvider({pageURL: "hello.html"});
      instance.init();
      assert.deepEqual(instance._pagemod.options.include, ["hello.html*"]);
    });
    describe("#onAttach", () => {
      let worker;
      function setup(custom = {}) {
        worker = new Worker(custom.url || TEST_URL);
        instance.init(custom.options);
        instance._pagemod.options.onAttach(worker);
      }
      it("should call onAttach passed to init(), if defined", () => {
        const onAttach = sinon.spy();
        setup({options: {onAttach}});
        assert.calledOnce(onAttach);
      });
      it("should add the worker to .workers", () => {
        setup();
        assert.equal(instance.workers.size, 1);
        assert.ok(instance.workers.get(worker));
      });
      it("should listen to detach, and remove worker when it is detached", () => {
        setup();
        assert.ok(instance.workers.get(worker));
        const [eventName, callback] = worker.on.firstCall.args;
        assert.equal(eventName, "detach", "added callback to 'detach'");
        callback();
        assert.isUndefined(instance.workers.get(worker), "callback removes worker");
      });
      it("should listen to CONTENT_TO_ADDON event from worker port", () => {
        setup();
        assert.calledWith(worker.port.on, CONTENT_TO_ADDON);
        assert.isFunction(worker.port.on.firstCall.args[1]);
      });
      describe("worker.on(CONTENT_TO_ADDON)", () => {
        let onMessage;
        function setupWithOnMessage() {
          onMessage = sinon.spy();
          setup({options: {onMessage}});
          // This is the callback for a CONTENT_TO_ADDON message
          return worker.port.on.firstCall.args[1];
        }
        it("should remove the worker if the event type is 'pagehide'", () => {
          const callback = setupWithOnMessage();
          assert.ok(instance.workers.get(worker));
          callback({type: "pagehide"});
          assert.isUndefined(instance.workers.get(worker), "pagehide event removes worker");
        });
        it("should call onMessage if defined", () => {
          const callback = setupWithOnMessage();
          callback({type: "FOO"});
          assert.calledOnce(onMessage);
        });
        it("should call onMessage with the right message", () => {
          const callback = setupWithOnMessage();
          callback({type: "FOO", data: "bar"});
          const result = onMessage.firstCall.args[0];
          assert.deepEqual(result.msg, {
            type: "FOO",
            data: "bar",
            workerId: instance.workers.get(worker)
          });
        });
        it("should call onMessage with the right worker", () => {
          const callback = setupWithOnMessage();
          callback({type: "FOO"});
          const result = onMessage.firstCall.args[0];
          assert.equal(result.worker, worker);
        });
      });
    });
  });
  describe("#getWorkerById", () => {
    it("should get a worker by id", () => {
      const id = "foo";
      const worker = new Worker("index.html");
      instance.workers.set(worker, id);
      instance.workers.set(new Worker("bar.html"), "bar");
      instance.workers.set(new Worker("baz.html"), "baz");
      assert.equal(instance.getWorkerById(id), worker);
    });
    it("should return undefined if the worker is not found", () => {
      instance.workers.set(new Worker("bar.html"), "bar");
      assert.isUndefined(instance.getWorkerById("foo"));
    });
  });
  describe("#addWorker", () => {
    it("should add a new worker", () => {
      const worker = new Worker();
      assert.equal(instance.workers.size, 0);
      instance.addWorker(worker);
      assert.equal(instance.workers.size, 1);
    });
    it("should generate an uuid for that worker and return it", () => {
      const worker = new Worker();
      instance = new PageModProvider({uuid: () => "foo"});
      instance.addWorker(worker);
      assert.equal(instance.workers.get(worker), "foo", "adds the worker id to the map");
      assert.equal(instance.addWorker(worker), "foo", "returns the id");
    });
    it("should just return the worker if it is already in the map", () => {
      const worker = new Worker();
      instance.addWorker(worker);
      instance.addWorker(worker);
      assert.equal(instance.addWorker(worker), instance.workers.get(worker), "returns the worker");
      assert.equal(instance.workers.size, 1, "does not add multiple copies of the worker");
    });
    it("should call options.onAddWorker if it is defined", () => {
      const onAddWorker = sinon.spy();
      instance = new PageModProvider({onAddWorker});
      instance.addWorker(new Worker());
      assert.calledOnce(onAddWorker);
    });
    it("should call logEvent if it was passed to the init function", () => {
      const logEvent = sinon.spy();
      const worker = new Worker();
      instance.init({logEvent});
      instance.addWorker(worker);
      assert.calledWith(logEvent, worker.tab, WORKER_ATTACHED_EVENT);
    });
  });
  describe("#removeWorker", () => {
    it("should remove a worker", () => {
      const worker = new Worker();
      instance.addWorker(worker);
      instance.removeWorker(worker);
      assert.equal(instance.workers.size, 0);
    });
    it("should call options.onRemoveWorker if it is defined", () => {
      const onRemoveWorker = sinon.spy();
      instance = new PageModProvider({onRemoveWorker});
      instance.removeWorker(new Worker());
      assert.calledOnce(onRemoveWorker);
    });
  });
  describe("#destroy", () => {
    it("should should not throw if .init was never called", () => {
      assert.doesNotThrow(() => instance.destroy());
    });
    it("should clear .workers", () => {
      instance.addWorker(new Worker());
      instance.addWorker(new Worker());
      instance.addWorker(new Worker());
      assert.equal(instance.workers.size, 3);
      instance.destroy();
      assert.equal(instance.workers.size, 0);
    });
    it("should destroy the sdk/page-mod if it was initialized", () => {
      instance.init();
      instance.destroy();
      assert.calledOnce(instance._pagemod.destroy);
    });
  });
});
