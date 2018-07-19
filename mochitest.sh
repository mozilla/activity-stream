#!/bin/bash

export SHELL=/bin/bash

# Pull latest m-c and update tip
cd /mozilla-central && hg pull && hg update -C

# Build Activity Stream and copy the output to m-c
cd /activity-stream && npm install . && npm run buildmc

# Build latest m-c with Activity Stream changes
cd /mozilla-central && ./mach build \
  && ./mach lint -l eslint -l codespell browser/extensions/activity-stream \
  && ./mach test browser/extensions/activity-stream --headless \
  && ./mach test browser/components/newtab/tests/browser --headless \
  && ./mach test browser/components/newtab/tests/xpcshell \
  && ./mach test browser/components/preferences/in-content/tests/browser_hometab_restore_defaults.js --headless \
  && ./mach test browser/components/preferences/in-content/tests/browser_newtab_menu.js --headless \
  && ./mach test browser/components/enterprisepolicies/tests/browser/browser_policy_set_homepage.js --headless \
  && ./mach test browser/components/preferences/in-content/tests/browser_search_subdialogs_within_preferences_1.js --headless
