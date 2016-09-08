"use strict";

const {before, after} = require("sdk/test/utils");
const {WorkerTask, TASK_NEW, TASK_WORKING, TASK_DONE} = require("addon/task-queue/WorkerTask");
const {Storage} = require("addon/task-queue/Storage");

const taskOptions = {
  pageUrl: "https://foo.bar",
  type: "fts"
};

const testTasks = [
  {
    pageUrl: "https://foo.bar",
    type: "fts"
  },
  {
    pageUrl: "https://foo.bar",
    type: "metadata"
  },
  {
    pageUrl: "https://foo.bar",
    type: "image-extraction"
  },
  {
    pageUrl: "https://example.com",
    type: "fts"
  },
  {
    pageUrl: "https://example.com",
    type: "metadata"
  }
];

let STORAGE;

exports["test Task status setting"] = function(assert) {
  let task = new WorkerTask(taskOptions.pageUrl, taskOptions.type);
  assert.equal(task.status, TASK_NEW, "Task created with new status");
  task.status = TASK_WORKING;
  assert.equal(task.status, TASK_WORKING, "Task status changed");
  task.status = TASK_DONE;
  assert.equal(task.status, TASK_DONE, "Task status changed");
};

exports["test Task invalid status setting throws"] = function(assert) {
  let task = new WorkerTask(taskOptions.pageUrl, taskOptions.type);
  assert.throws(() => {task.status = "not a valid status";}, /Invalid task status/, "Invalid task status throws.");
};

exports["test Task job started"] = function(assert) {
  let task = new WorkerTask(taskOptions.pageUrl, taskOptions.type);
  assert.equal(task.jobStartedAt, null, "New task job started time is null.");
  assert.equal(task.status, TASK_NEW, "Task created with new status");
  task.jobStarted();
  assert.ok(() => task.jobStartedAt <= Date.now() && task.jobStartedAt > task.createdAt,
            "Task job started time assigned.");
  assert.equal(task.status, TASK_WORKING, "Task status is now working.");
};

exports["test Task serialization and deserialization"] = function(assert) {
  let fullTask = {
    id: 1,
    pageUrl: "https://foo.bar",
    createdAt: Date.now() - 3600,
    jobStartedAt: Date.now(),
    status: "new",
    type: "fts"
  };

  // Creates a new task from the fullTask object
  let task = WorkerTask.fromObject(fullTask);

  // Serializes the task and compare to the serialized fullTask
  let serializedTask = JSON.stringify(task);
  assert.equal(serializedTask, JSON.stringify(fullTask), "Serialized task is equal to serialized origin object");

  // Creates a new copy of the task from the serialized version and compares to the original one
  assert.deepEqual(WorkerTask.fromObject(JSON.parse(serializedTask)), task, "Task serialized and then deserialized have the same values");
};

exports["test save task"] = function*(assert) {
  // Create new task and saves it
  let task = new WorkerTask(taskOptions.pageUrl, taskOptions.type);
  yield task.save();
  assert.ok(task.id, "Task has an id assigned to it.");

  // Get the saved task from the database and compare to the original one.
  let savedTask = yield WorkerTask.asyncGetById(task.id);
  assert.deepEqual(task, savedTask, "Saved task was recovered");

  // Changes the task and save it again
  task.jobStarted();
  yield task.save();

  // Get the changed task from the database and compare it again
  savedTask = yield WorkerTask.asyncGetById(task.id);
  assert.deepEqual(task, savedTask, "Modified saved task was recovered");
};

exports["test getting tasks by url"] = function*(assert) {
  let emptyTasks = yield WorkerTask.asyncGetByUrl("https://foo.bar");
  assert.equal(emptyTasks, null, "No tasks created for this url.");

  // Create new tasks and saves them
  for (let taskData of testTasks) {
    let newTask = new WorkerTask(taskData.pageUrl, taskData.type);
    yield newTask.save();
    assert.ok(newTask.id, "Task has an id assigned to it.");
  }

  let tasks = yield WorkerTask.asyncGetByUrl("https://foo.bar");
  assert.equal(tasks.length, 3, "Tasks created for this domain.");
};

exports["test if url exists"] = function*(assert) {
  const emptyTasks = yield WorkerTask.asyncGetByUrl("https://foo.bar");
  assert.equal(emptyTasks, null, "No tasks created for this url.");

  const newTask = new WorkerTask("https://foo.bar", "metadata");
  yield newTask.save();
  assert.ok(newTask.id, "Task has an id assigned to it.");

  const taskFound = yield WorkerTask.asyncURLExists("https://foo.bar");
  assert.ok(taskFound, "Task found for existing url");

  const taskNotFound = yield WorkerTask.asyncURLExists("https://bar.foo");
  assert.ok(!taskNotFound, "Task not found for inexistent url");
};

before(exports, function*() {
  STORAGE = Storage.instance();
  yield STORAGE.asyncCreateTables();
});

after(exports, function*() {
  yield STORAGE.asyncDropTables();
  yield STORAGE.asyncCloseConnection();
});

require("sdk/test").run(exports);
