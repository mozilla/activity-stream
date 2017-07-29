# Preferences in Activity Stream

## Preference branch

The preference branch for activity stream is `browser.newtabpage.activity-stream.`.
Any preferences defined in the preference configuration will be relative to that
branch. For example, if a preference is defined with the name `foo`, the full
preference as it is displayed in `about:config` will be `browser.newtabpage.activity-stream.foo`.

## Defining new preferences

All preferences for Activity Stream should be defined in the `PREFS_CONFIG` Array
found in [lib/ActivityStream.jsm](../../system-addon/lib/ActivityStream.jsm).
The configuration object should have a `name` (the name of the pref), a `title`
that describes the functionality of the pref, and a `value`, the default value
of the pref. Optionally a `getValue` function can be provided to dynamically
generate a default pref value based on args, e.g., geo and locale. For
developers-specific defaults, an optional `value_local_dev` will be used instead
of `value`. For example:

```js
{
  name: "telemetry.log",
  title: "Log telemetry events in the console",
  value: false,
  value_local_dev: true,
  getValue: ({geo}) => geo === "CA"
}
```

## Reading, setting, and observing preferences from `.jsm`s

To read/set/observe Activity Stream preferences, construct a `Prefs` instance found in [lib/ActivityStreamPrefs.jsm](../../system-addon/lib/ActivityStreamPrefs.jsm).

```js
// Import Prefs
XPCOMUtils.defineLazyModuleGetter(this, "Prefs",
  "resource://activity-stream/lib/ActivityStreamPrefs.jsm");

// Create an instance
const prefs = new Prefs();
```

The `Prefs` utility will set the Activity Stream branch for you by default, so you
don't need to worry about prefixing every pref with `browser.newtabpage.activity-stream.`:

```js
const prefs = new Prefs();

// This will return the value of browser.newtabpage.activity-stream.foo
prefs.get("foo");

// This will set the value of browser.newtabpage.activity-stream.foo to true
prefs.set("foo", true)

// This will call aCallback when browser.newtabpage.activity-stream.foo is changed
prefs.observe("foo", aCallback);

// This will stop listening to browser.newtabpage.activity-stream.foo
prefs.ignore("foo", aCallback);
```

See [toolkit/modules/Preferences.jsm](https://dxr.mozilla.org/mozilla-central/source/toolkit/modules/Preferences.jsm)
for more information about what methods are available.
