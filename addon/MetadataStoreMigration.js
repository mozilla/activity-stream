/*
 * The migration file for the metadata store
 *
 * Each migration consists of a version, an optional description, and an array of migration
 * statements. The order of migrations array will be treated as the timeline of migration history.
 * Therefore, the migration history should be used as an immutable array, you should never
 * delete versions if they have already been migrated. Instead, you should create a new
 * migration to revert its effect.
 *
 * Note that all the migration actions are subject to the related rules of SQLite, there are
 * some certain actions that are not revertible. Please use this feature sparingly.
 *
 * Reference:
 * [1]. https://www.sqlite.org/lang_altertable.html
 *
 * Example:
 * exports.migration = [
 *   {
 *     version: "1.0.0",
 *     description: "A dummy migration as a sentinel",
 *     statements: [],
 *   },
 *   {
 *     version: "1.0.1",
 *     description: "version 1.0.1",
 *     statements: ["ALTER TABLE foo ADD COLUMN bar VARCHAR(32)"],
 *   }
 * ]
 */

// Don't delete the version "1.0.0" as it acts as a sentinel
exports.MIGRATIONS = [
  {
    version: "1.0.0",
    description: "A dummy migration as a sentinel",
    statements: []
  }
];
