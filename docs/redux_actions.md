
## Architecture - ActionManager
When you instantiate an `ActionManager`, you give it a list of types which are valid for the application. If at any time you try to create an action with a type that isn't part of that list, it will throw an error. Yay!

```js
const am = new ActionManager(["STUFF_REQUEST", "STUFF_RESPONSE"]);
```

You can find the action manager instance for Activity stream at `common/action-manager`.

### Dispatching actions
To dispatch actions, all you have to do is call `am.actions.YourActionType(...)`.

By default, there is a `Action` type action defined which simply takes an object as an argument. However, it is a good idea to define actions that are specific enough to prevent typos and formatting errors.

```js
const {actions} = require("common/action-manager");

// These are all equivalent
this.dispatch(actions.Action({
  type:"TOP_FRECENT_SITES_REQUEST",
  meta: {expect: "TOP_FRECENT_SITES_RESPONSE"}
}));
this.dispatch(actions.RequestExpect("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"));
this.dispatch(actions.GetTopFrecentSites());
```

### Defining new actions
You can define new actions on the `ActionManager` instance with `am.defineActions`. All action definitions should be functions that return a plain object representing the action.

```js
function Foo(data) {
  return {type: 'FOO', data};
}
am.defineActions({Foo});
```

All new actions will have some basic validators applied to them like checking for the `type` property. Action functions also get called in the context of the action manager instance.

#### Extending existing actions
Most new actions will actually be extensions of new ones. To do this, simply call another action function inside your new one.

It is generally **not** a good idea to call `this.actions.SomeAction` inside another action, as that will result in the validators being run twice. Use the plain `SomeAction` function instead, or you can access it from `this.actions.SomeAction.definition`.

```js
function Request(type, data) {
  return {type, data};
}
function GetFoo() {
  return Request(foo);
}
am.defineActions({Request, GetFoo});
```

## Conventions for Actions
In this project we use a modified version of the `Standard Flux Action`. Our standard action looks something like this:

```js
{
  // The type should be upper-case.
  // Request-type actions should end in _REQUEST
  // Response-type actions should end in _RESPONSE
  // Required.
  type: "SOMETHING_REQUEST",

  // For request or response-type actions.
  // For responses:
  //    If the response is successful, it should be an array OR object.
  //    If the response is an error, it should be an Error.
  // Optional.
  data: {},

  // This should be included for actions that contain errors
  // It should be true, or omitted if not applicable.
  error: true

  // This can contain action-specific info
  meta: {
    // This is to indicate that the application should receive the
    // following action within a specified time period, or a timeout
    // error should be thrown
    expect: "SOMETHING_RESPONSE",

    // Optional. A custom timeout for an 'expect' type action.
    timeout: 10000,

    // This indicates to the ReduxChannel middleware that
    // the action should broadcast via message passing to the other
    // side of the channel.
    broadcast: "content-to-addon",

    // This indicates new results should be appended to old results,
    // instead of replacing them.
    append: true
  }
}
```
