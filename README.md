# Activity Stream Add-on

[![](https://img.shields.io/badge/available_on-Test_Pilot-0996F8.svg)](https://testpilot.firefox.com/experiments/activity-stream)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/activity-stream/badge.svg?branch=master)](https://coveralls.io/github/mozilla/activity-stream?branch=master)

## TLDR; I just want to try the add-on

1. Make sure you have Firefox Beta, node 5.0+ and at npm 3.0+ installed.
2. `npm install`
3. `npm run once`

## Requirements

* You must have at Firefox (45.0+) installed
* node 5.0+, npm 3.0+ (You can install both [here](https://nodejs.org))

## Installation

Just clone the repo and install the dependencies.

```sh
git clone https://github.com/mozilla/activity-stream.git
cd activity-stream
npm install
```

## Configuration

Default configuration is in `config.default.yml`. Create a file called `config.yml` to override any default configuration.

## Embedly Proxy Server

By default, the add-on will request data from embedly through a dev instance of our embedly proxy server. If you want to **run the add-on with a different endpoint**, change the following in `config.yml`:

```yaml
EMBEDLY_ENDPOINT: http://....
```
Please file issues related to the embedly proxy server at https://github.com/mozilla/embedly-proxy/issues.

## Using shim data

If you want to run the content on http://localhost:1963 with **shim data** (i.e. outside the add-on), add the following to `config.yml`.
```yaml
USE_SHIM: true
```

You can also disable the embedly service by setting `EMBEDLY_ENDPOINT` to an empty string.

## Running tasks

You may run `npm run help` to see a description of all commands available, which you can run via `npm run [command]`. Here are some important ones:

### Running the add-on

If you just want to build assets and run the add-on to test it, you may simply run:

`npm run once`

### Developing the add-on

If you want to watch assets and compile them continuously, you will want to run
```sh
npm run start
```
in one terminal session, and
```sh
npm run firefox
```
to start the add-on. This way, when you make changes to the `content-src` folder, they will be reflected immediately without needing to restart the add-on.

### Running Tests

Run `npm test` to run the tests once. Run `npm run help` for more options.

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
