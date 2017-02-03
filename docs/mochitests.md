We use [mochitests](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/Mochitest) to do functional (and possibly integration) testing. Mochitests are part of Firefox and allow us to test activity stream literally as you would use it.

Mochitests require a local checkout of the Firefox source code. This is because they are used to test a lot of Firefox, and you would usually run them inside Firefox. We are developing activity stream outside of Firefox, but still want to test it as part of Firefox, so we've borrowed the debugger.html infrastructure for using them.

Mochitests live in `test/functional/mochitest`, and as of this writing, they are all the [`browser-chrome`](https://developer.mozilla.org/en-US/docs/Mozilla/Browser_chrome_tests) flavor of mochitests.

## Getting Started

**Requirements**

* mercurial ( `brew install mercurial` )
* autoconf213 ( `brew install autoconf@2.13 && brew unlink autoconf` )

If you haven't set up the mochitest environment yet, just run this:

```
./bin/prepare-mochitests-dev
```

This will set up everything you need. You should run this *every time* you start working on mochitests, as it makes sure your local copy of Firefox is up-to-date.

On the first run, if you don't already have a mozilla-central repo as a sibling of your activity stream repo, this will download one and set up an [artifact build](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Artifact_builds) (just think of a super fast Firefox build). It may take a while (10-15 minutes) to download and build Firefox.

If you do already have a mozilla-central repo, the script ask you if you're ok with losing any local changes in that repo, and, if so, it will merely update to  the latest bits and then export your current activity-stream repo to that
mozilla-central.

If you want to change an existing build to a (much faster) artifact build,

Now, you can run the mochitests like this:

```
cd ../mozilla-central
./mach mochitest -f browser browser/extensions/activity-stream/test/functional/mochitest
```

This works because we've symlinked the local mochitests into where the debugger lives in Firefox. Any changes to the tests in `src/test/mochitest` will be reflected and you can re-run the tests.

Visit the [mochitest](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/Mochitest) and [`browser chrome`](https://developer.mozilla.org/en-US/docs/Mozilla/Browser_chrome_tests) MDN pages to learn more about mochitests. A few tips:

* Passing `--jsdebugger` will open a JavaScript debugger and allow you to debug the tests (sometimes can be fickle)

### For Windows Developers

*NOT YET TESTED FOR ACTIVITY STREAM*: The detailed instructions for setting up your environment to build Firefox for Windows can be found [here](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Windows_Prerequisites). You need to install the latest `MozBuild` package. You can open a unix-flavor shell by starting:

```
C:\mozilla-build\start-shell.bat
```

In the shell, navigate to the activity-stream project folder, and follow the Getting Started instructions as mentioned.


## Making code changes

The mochitests are running against the compiled activity-stream bundle inside the Firefox checkout. This means that you need to update the bundle whenever you make code changes. `./bin/prepare-mochitests-dev` does this for you initially, but you can manually update it with:

```
npm run export
```

That will build the debugger and copy over all the relevant files into `firefox`, including mochitests. If you want it to only symlink the mochitests directory, set the SYMLINK_TESTS environment variable to the value "true" (which is what `./bin/prepare-mochitests-dev` does).

## Adding New Tests

If you add new tests, make sure to list them in the `browser.ini` file. You will see the other tests there. Add a new entry with the same format as the others. You can also add new JS or HTML files by listing in under `support-files`.

## Writing Tests

Here are a few tips for writing mochitests:

* Only write mochitests for testing the interaction of multiple components on the page and to make sure that the protocol is working.
* If you need to access the content page, use `ContentTask.spawn`:

```js
ContentTask.spawn(gBrowser.selectedBrowser, null, function* () {
  content.wrappedJSObject.foo();
});
```

The above calls the function `foo` that exists in the page itself. You can also access the DOM this way: `content.document.querySelector`, if you want to click a button or do other things. You can even you use assertions inside this callback to check DOM state.
