# Setting custom `geo`, `locale`, and update channels

There are instances where you may need to change your local build's locale, geo, and update channel (such as changes to the visibility of Discovery Stream on a per-geo/locale basis in `ActivityStream.jsm`).

## Changing update channel

- Change `app.update.channel` to desired value (eg: `release`) by editing `LOCAL_BUILD/Contents/Resources/defaults/pref/channel-prefs.js`. (**NOTE:** Changing pref `app.update.channel` from `about:config` seems to have no effect!)

## Changing geo

- Set `browser.search.region` to desired geo (eg `CA`)

## Changing locale

- Toggle `extensions.langpacks.signatures.required` to `false`
- Toggle `xpinstall.signatures.required` to `false`
- Toggle `intl.multilingual.downloadEnabled` to `true`
- Toggle `intl.multilingual.enabled` to `true`
- Open the langpack URL for target locale in your local build (eg `https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central-l10n/mac/xpi/firefox-70.0a1.en-CA.langpack.xpi`)
- In `about:preferences` click "Set Alternatives" under "Language", move desired locale to the top position, click OK, click "Apply And Restart"
