# Snippets in ActivityStream

## `gSnippetsMap`

`gSnippetsMap` is available to all snippet templates and has methods that a
regular `Map` has: `set`, `get`, `delete`, `clear`, etc.

If you don't care about the completion of the transaction, you may simply use these
methods synchronously:

```js
function setFoo() {
  gSnippetsMap.set("foo", 123);
  return gSnippetsMap.get("foo"); // returns 123
}
```

However, unlike the previous version of snippets, `set`, `delete`, and `clear`
all return a `Promise` that will resolve or reject when the `indexedDB` transaction
is complete. For example:

```js
async function setFoo() {
  await gSnippetsMap.set("foo", 123);
  return gSnippetsMap.get("foo");
}
```

### Expected values in gSnippetsMap

Note that names and functionality of values in v4 snippets have been preserved
where possible.

`snippets-cached-version`: The version number of the snippets cached in `snippets`.

`snippets-last-update`: The last time snippets were updated.

`snippets`: The cached payload of the response from the snippets server.
