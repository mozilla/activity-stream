# Activity Stream Add-on

[![](https://img.shields.io/badge/available_on-Test_Pilot-0996F8.svg)](https://testpilot.firefox.com/experiments/activity-stream)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/activity-stream/badge.svg?branch=master)](https://coveralls.io/github/mozilla/activity-stream?branch=master)

This is the source code for the Activity Stream project, which replaces the "New Tab" of Firefox with a new design based on rich metadata and browsing behavior.

## Installing

To install the release version of the add-on, check out [Test Pilot](https://testpilot.firefox.com/experiments/activity-stream).

If you would like to see changes more regularly, you can install the [dev build](https://moz-activity-streams-dev.s3.amazonaws.com/dist/latest.html), which is updated on every commit.

## For Localizers

Activity Stream localization is managed via [Pontoon](https://pontoon.mozilla.org/projects/activity-stream-new-tab/), not direct pull requests to the repository. If you want to fix a typo, add a new language, or simply know more about localization, please get in touch with the [existing localization team](https://pontoon.mozilla.org/teams/) for your language, or Mozilla’s [l10n-drivers](https://wiki.mozilla.org/L10n:Mozilla_Team#Mozilla_Corporation) for guidance.

## For Developers

### TLDR; I just want to run it

1. Make sure you have Firefox Beta, node 5.0+ and at npm 3.0+ installed.
2. `npm install`
3. `npm run once`

### Requirements

* You must have at Firefox (45.0+) installed
* node 5.0+, npm 3.0+ (You can install both [here](https://nodejs.org))

### Installation

* install from pre-builts
  - [dev](https://s3.amazonaws.com/moz-activity-streams-dev/dist/latest.html)
  - [pre-release](https://s3.amazonaws.com/moz-activity-streams-prerelease/dist/latest.html)
  - [release](https://moz-activity-streams.s3.amazonaws.com/dist/latest.html)

* install from source

  ```sh
  git clone https://github.com/mozilla/activity-stream.git
  cd activity-stream
  npm install
  npm run package
  ```

### Configuration

Default configuration is in `config.default.yml`. Create a file called `config.yml` to override any default configuration.

### Running tasks

You may run `npm run help` to see a description of all commands available, which you can run via `npm run [command]`. Here are some important ones:

#### Running the add-on

If you just want to build assets and run the add-on to test it, you may simply run:

```sh
npm run once
```

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

### Running benchmarks

Run `npm run benchmark` to run the benchmarks once. See more details for benchmarking the add-on [here](benchmark_how_to.md).

### Exporting to mozilla-central

To export the bootstrapped add-on to a `mozilla-central` directory that shares the same parent as this current directory, run this command:

```sh
npm run buildmc
```

This will first clear out any existing files from `mozilla-central/browser/extensions/activity-stream` before copying over the newly built files and optionally patching `mozilla-central/browser/extensions/moz.build` to get the add-on built with Firefox. These changes to `mozilla-central` are uncommitted and ready for building/testing/committing.

Note: You can create a `symlink` to the `mozilla-central` repository, e.g.,

```sh
ln -s ~/other-located-or-named-mozilla-central ../mozilla-central
```
