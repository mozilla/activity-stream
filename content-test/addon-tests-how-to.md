# How to write add-on tests with mocha

## How is add-on Javascript different from content Javascript?

Javascript on the add-on side (i.e. Javascript intended to run the chrome process) does *not* have access to any browser apis or objects, such as `setTimeout` or `window`. Additionally, modules loaded with `require` do *not* have the ability access or modify any shared globals. Unlike content code, add-on javascript may import code from other parts of Firefox or the add-on sdk directly.

However, if you are writing tests for add-on code with mocha, remember that in mocha tests your Javascript will always be **run in a browser context** as if it were content code.

## Differences between module loaders for add-on javascript v.s. content javascript

Although both use implementations of common-js and have a similar interface (i.e. `require`, `module`, and `exports`), there are a few differences between the module loader available for add-on side and the module loader for javascript code executed on the content side.

### Module loading in add-on code

The module-loader for add-on code is provided by the add-on sdk.

- relative modules are supported (e.g. `require("./foo.js")` will resolve to `foo.js` in the same directory as the file that calls it)
- absolute paths are resolved relative to the root directory (e.g. `require("foo.js")` will resolve to `activity-stream/foo.js`)
- some modules can be loaded from Firefox by name, such as `chrome` and `sdk` (e.g. `require("sdk/tabs")`)
- modules **cannot** be loaded directly from npm. external dependencies need to be added to `common/vendor-src.js` and imported with `require("common/vendor")`

### Module loading in content code

All content-side javascript (with the exception of frame scripts) is preprocessed by `webpack`, which is what provides its module loader. It has the following properties:

- relative modules are supported (same as add-on sdk)
- absolute paths are supported for some folders; these short forms are configured in webpack.common.js (e.g. `require("lib/foo.js")` will resolve to content-src/lib/foo.js)
- modules from Firefox **cannot** be loaded (e.g. `require("sdk/tabs")` will fail, since `sdk` is not available)
- modules can be loaded directly from `npm` by name (e.g. `require("react")`)

## How to set up a test for add-on code in mocha

### Requiring the file

Let's say we have a file called `addon/AvocadoProvider.js`. First, we will add a file to the `content-test/addon/` directory and call it `AvocadoProvider.test.js`. All test files run by mocha ***must end with .test.js***.

Now, let's require our file:

```js
const AvocadoProvider = require("addon/AvocadoProvider.js")
```

Note that we can require anything that is in addon directory with the absolute path `addon/` because it is configured in `webpack.common.js`. if you want, you could also use a relative url.

### Creating a mocha test

When you write a test in mocha, you have access to a few different globals. Here is an example of a test:

```js
const AvocadoProvider = require("addon/AvocadoProvider.js");

describe("AvocadoProvider", () => {
  let avocadoProvider;

  beforeEach(() => {
    avocadoProvider = new AvocadoProvider();
    avocadoProvider._internalAvocadoStuff = sinon.spy();
  });

  it("should give me an avocado", () => {
    assert.equal(avocadoProvider.get(), "avocado");
    assert.calledOnce(avocadoProvider._internalAvocadoStuff);
  });
});
```

As you can see, you can create test blocks with `describe`, individual tests with `it`, and before/after blocks with `before`,`beforeEach`, `after`, and `afterEach` (read more about this in the [Mocha docs](https://mochajs.org/)).

Assertions (the `assert` global) are from [chai](http://chaijs.com/api/assert/), and extended with sinon's [assertions api](sinonjs.org/docs/#assertions-api). You also get a `sinon` global for stubs, spies, mocks, and more.


### Running the test

To run the mocha test suite in continuous watch mode, use the command:

```
npm run tdd
```

This means that the tests will re-run every time you make a change.

### Running a single test file

If you want to skip all the other tests and *only* run your tests in `AvocadoProvider.test.js`, you will need to edit the file at `content-test/index.js`. You need to comment out the line that says `files.forEach(file => req(file));` and edit/uncomment the line below it, something like this:

```js
// files.forEach(file => req(file));
req("./addon/AvocadoProvider.test.js");
```

### Importing sdk/chrome modules in mocha tests

Let's say our `AvocadoProvider.js` imports `sdk/tabs`. Because content code does not allow us to import things from Firefox, normally we would expect webpack to throw an error. However, we are actually able to handle these imports just fine! This is because for our mocha test suite we ***have pre-configured shim modules for chrome and sdk***. These are defined in `karma.conf.js`.

All the pre-configured shims are in the `mocks/` directory. For example, the `sdk/tabs` shim can be found in `mocks/sdk/tabs.js`. Many of these are already configured with spies to help you test your code better.

### When you get unexpected errors

Not *all* modules, or properties or methods of modules, and defined in the `mocks/` directory. If you use an sdk module that is not yet shimmed, you might see an error like this:

```
ERROR in ./addon/AvocadoProvider.js
Module not found: Error: Cannot resolve module 'sdk/cool-stuff' in ~/activity-stream/addon/AvocadoProvider.js
 @ ./addon/AvocadoProvider.js 3:0-19
```

If that is the case, you should add a new file to the appropriate place in the directory. You may also need to add missing methods or properties, if they don't exist and are needed at import time.

Generally, it is good practice ***not to cause side effects at import time*** (that is, when your code is required, before it is intialized), so hopefully you won't need to define global shims that are too deep or elaborate. Instead, you can *override* the shim for your individual tests.

### At this point...

...you might have everything you need to write your tests. In that case, stop reading!

### Overriding requires

There are a number of reasons why you might want to override a module that is imported in a module you are testing:

1. It might be a big module such as `addon/PerfMeter.js` with lots of set up logic required that isn't really required for your tests
2. You might want to modify or extend the individual methods on a shimmed module, such as `Cu.import`
3. You might want to have a new instance of a shimmed module for each test so that you don't have to reset the spies/state

Let's use our `AvocadoProvider.js` example again. Here is what this file might look like:

```js
const {PerfMeter} = require("./PerfMeter");
const tabs = require("sdk/tabs");

module.exports = class AvocadoProvider {
  ...
  ...
};
```
In our tests, we would like to replace the PerfMeter with an empty object, and create a new `tabs` shim for each test.

In `AvocadoProvider.test.js` we require the file into our test with a special syntax:

```js

const AvocadoProviderCreator = require("inject!addon/AvocadoProvider");
```

Notice the `inject!` before the file path. This will return a function which returns `AvocadoProvider`:

```js
const AvocadoProviderCreator = require("inject!addon/AvocadoProvider");
const AvocadoProvider = AvocadoProviderCreator();
```

In order to override anything `AvocadoProvider.js` requires, we pass an object to the creator function. Each key must exactly equal the string that was passed to the require function.

We can get our `Tabs` constructor by requiring it from `mocks/`:

```js
const {Tabs} = require("mocks/sdk/tabs");
const AvocadoProviderCreator = require("inject!addon/AvocadoProvider");
const AvocadoProvider = AvocadoProviderCreator({
  "./PerfMeter": {PerfMeter: {}},
  "sdk/tabs": new Tabs()
});
```

### TODO: Overriding globals

This has not yet been implemented in the test utilities. For now, you can override globals by setting `global.x` in your test file before requiring any dependencies. Just remember to restore the original value after your test suite is finished! In order to do this, you may want to use `beforeEach`/`afterEach` blocks to set and restore values (see the `overrideConsoleError` utilities for an example)
