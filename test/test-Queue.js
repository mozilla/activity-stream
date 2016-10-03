"use strict";

const {LIFOQueue} = require("addon/task-queue/Queue");

exports["test enqueuing and dequeuing in LIFO order"] = function(assert, done) {
  let queue = new LIFOQueue();

  assert.equal(queue.size, 0, "Queue start size is 0.");

  let items = Array.from(Array(100).keys());

  for (let item of items) {
    queue.enqueue(item);
  }

  assert.equal(queue.size, items.length, "queue size is correct.");

  // Reverse the array, so we can check LIFO order
  items.reverse();

  for (let item of items) {
    assert.equal(queue.dequeue(), item, "Dequeued item in the right order.");
  }

  assert.equal(queue.size, 0, "After dequeuing all, the queue is empty again.");
  done();
};

exports["test dequeuing empty queue"] = function(assert, done) {
  let queue = new LIFOQueue();
  assert.strictEqual(queue.dequeue(), null, "null returned for empty dequeue.");
  done();
};

exports["test enqueuing null value"] = function(assert, done) {
  let queue = new LIFOQueue();
  queue.enqueue(null);

  assert.equal(queue.size, 0, "null value shouldn't be enqueued.");
  done();
};

exports["test peek"] = function(assert, done) {
  let queue = new LIFOQueue();
  assert.equal(queue.peek(), null, "null peek value for empty queue.");

  const ONE = 1;
  const TWO = 2;
  queue.enqueue(ONE);
  assert.equal(queue.peek(), ONE, "peek value is first enqueued item.");

  queue.enqueue(TWO);
  assert.equal(queue.peek(), TWO, "peek value is last enqueued item.");

  queue.dequeue();
  assert.equal(queue.peek(), ONE, "peek value is again the first enqueued item.");

  queue.dequeue();
  assert.equal(queue.peek(), null, "null peek value for empty queue again.");
  done();
};

require("sdk/test").run(exports);
