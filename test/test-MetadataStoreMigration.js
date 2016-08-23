const {MetadataStore} = require("addon/MetadataStore.js");
const {migrationV1Fixture, migrationV2Fixture} = require("./lib/MetastoreFixture.js");

exports.test_migration = function*(assert) {
  let metaStore = new MetadataStore(null, migrationV1Fixture);
  yield metaStore.asyncConnect();

  // Check the new column
  let columns = yield metaStore.asyncExecuteQuery("PRAGMA table_info(page_metadata)");
  let newColumn = columns[columns.length - 1];  // The last column should be the one in the migration
  assert.equal(newColumn[1], "foo");

  // Check the version gets tracked correctly
  let result = yield metaStore.asyncExecuteQuery("SELECT version FROM migrations", {columns: ["version"]});
  assert.equal(result[0].version, "1.0.2", "It should return the current version");

  // Check the new tables
  result = yield metaStore.asyncExecuteQuery("SELECT name FROM sqlite_master WHERE type='table'", {columns: ["name"]});
  let tables = new Set();
  result.forEach(table => tables.add(table.name));
  assert.ok(tables.has("migrations"), "It should have created the migration table");
  assert.ok(tables.has("test_table"), "It should have created the table in the migration");
  assert.ok(!tables.has("test_table_temp"), "It should have renamed the table in the migration");

  yield metaStore.asyncClose();

  // Let's open it again with another migration
  metaStore = new MetadataStore(null, migrationV2Fixture);
  yield metaStore.asyncConnect();

  // Check the new column
  columns = yield metaStore.asyncExecuteQuery("PRAGMA table_info(test_table)");
  newColumn = columns[columns.length - 1];  // The last column should be the one in the migration
  assert.equal(newColumn[1], "bar");

  // Check the version gets tracked correctly
  result = yield metaStore.asyncExecuteQuery("SELECT version FROM migrations", {columns: ["version"]});
  assert.equal(result[0].version, "1.0.3", "It should return the current version");

  yield metaStore.asyncTearDown();
};

require("sdk/test").run(exports);
