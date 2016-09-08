const {TaskProcessor} = require("addon/task-queue/TaskProcessor");
const {getResourceURL} = require("addon/task-queue/utils");

class DeferProcessor extends TaskProcessor {
  constructor(defer, tasksUntilDefer = 1) {
    super(getResourceURL("test/resources/echo-worker.js"), 1);
    this.defer = defer;
    this.tasksUntilDefer = tasksUntilDefer;
    this.tasksDone = 0;
    this._taskType = "defer";
  }

  handleResults(data) {
    this.tasksDone++;
    if (this.tasksDone === this.tasksUntilDefer) {
      this.defer.resolve(this.tasksDone);
    }
  }
}

exports.DeferProcessor = DeferProcessor;
